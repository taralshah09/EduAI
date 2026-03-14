const PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const CLIENT_VERSION = "20.10.38";
const USER_AGENT = `com.google.android.youtube/${CLIENT_VERSION} (Linux; U; Android 14)`;

const VIDEO_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

function extractVideoId(input) {
  if (input.length === 11) return input;
  const match = input.match(VIDEO_ID_REGEX);
  if (match) return match[1];
  throw new Error("Could not extract YouTube video ID");
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function parseTranscriptXml(xml, lang) {
  const results = [];
  const tagRe = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  const legacyRe = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
  let m;

  // Try the newer <p> format first
  while ((m = tagRe.exec(xml)) !== null) {
    const offset = parseInt(m[1], 10);
    const duration = parseInt(m[2], 10);
    let text = "";
    const wordRe = /<s[^>]*>([^<]*)<\/s>/g;
    let w;
    while ((w = wordRe.exec(m[3])) !== null) text += w[1];
    if (!text) text = m[3].replace(/<[^>]+>/g, "");
    text = decodeEntities(text).trim();
    if (text) results.push({ text, offset, duration, lang });
  }

  if (results.length > 0) return results;

  // Fall back to legacy <text> format
  while ((m = legacyRe.exec(xml)) !== null) {
    results.push({
      text: decodeEntities(m[3]),
      offset: parseFloat(m[1]),
      duration: parseFloat(m[2]),
      lang,
    });
  }
  return results;
}

async function fetchTranscriptTracks(tracks, videoId, lang) {
  const track = lang ? tracks.find((t) => t.languageCode === lang) : tracks[0];
  if (!track) {
    const available = tracks.map((t) => t.languageCode).join(", ");
    throw new Error(`No transcript in "${lang}". Available: ${available}`);
  }
  const res = await fetch(track.baseUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Failed to fetch transcript XML for ${videoId}`);
  return parseTranscriptXml(await res.text(), lang ?? tracks[0].languageCode);
}

export async function fetchTranscript(urlOrId, { lang } = {}) {
  const videoId = extractVideoId(urlOrId);
  let metadata = { duration: 0, title: "" };

  // Try the InnerTube API first (no HTML parsing, more reliable)
  try {
    const res = await fetch(PLAYER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: CLIENT_VERSION } },
        videoId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      metadata.duration = parseInt(data?.videoDetails?.lengthSeconds || 0, 10);
      metadata.title = data?.videoDetails?.title || "";

      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        const items = await fetchTranscriptTracks(tracks, videoId, lang);
        return { items, metadata };
      }
    }
  } catch (err) {
    console.error("InnerTube fetch error:", err.message);
  }

  // Fallback: scrape the watch page
  const page = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      ...(lang && { "Accept-Language": lang }),
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)",
    },
  });
  const html = await page.text();
  if (html.includes(`class="g-recaptcha"`)) throw new Error("YouTube is rate-limiting this IP");
  if (!html.includes(`"playabilityStatus":`)) throw new Error(`Video unavailable: ${videoId}`);

  const match = html.match(/var ytInitialPlayerResponse\s*=\s*(\{)/);
  if (!match) throw new Error(`Could not parse player response for ${videoId}`);

  // Balanced brace extraction
  const start = html.indexOf(match[0]) + match[0].length - 1;
  let depth = 0,
    end = start;
  for (; end < html.length; end++) {
    if (html[end] === "{") depth++;
    else if (html[end] === "}" && --depth === 0) break;
  }
  const playerData = JSON.parse(html.slice(start, end + 1));

  metadata.duration = parseInt(playerData?.videoDetails?.lengthSeconds || 0, 10);
  metadata.title = playerData?.videoDetails?.title || "";

  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(tracks) || tracks.length === 0) {
    throw new Error(`Transcripts disabled or unavailable for ${videoId}`);
  }
  const items = await fetchTranscriptTracks(tracks, videoId, lang);
  return { items, metadata };
}

// ── Helpers (same API as before) ────────────────────────────────────────────

export { extractVideoId };

export function joinTranscript(items) {
  return items.map((t) => t.text).join(" ");
}

export function chunkTranscript(items, wordLimit = 600) {
  const words = joinTranscript(items).split(/\s+/);
  const chunks = [];
  const overlap = 50;
  let i = 0,
    chunkIndex = 0;
  while (i < words.length) {
    chunks.push({ chunkIndex, text: words.slice(i, i + wordLimit).join(" ") });
    chunkIndex++;
    i += wordLimit - overlap;
  }
  return chunks;
}