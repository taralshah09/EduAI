const VIDEO_ID_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

function extractVideoId(input) {
  if (input.length === 11) return input;
  const match = input.match(VIDEO_ID_REGEX);
  if (match) return match[1];
  throw new Error("Could not extract YouTube video ID");
}

export async function fetchTranscript(urlOrId, { lang } = {}) {
  const videoId = extractVideoId(urlOrId);
  const keys = [
    process.env.SUPADATA_API_KEY_1,
    process.env.SUPADATA_API_KEY_2,
    process.env.SUPADATA_API_KEY_3,
    process.env.SUPADATA_API_KEY_4,
    process.env.SUPADATA_API_KEY_5,
    process.env.SUPADATA_API_KEY_6,
    process.env.SUPADATA_API_KEY_7,
    process.env.SUPADATA_API_KEY_8,
  ].filter(Boolean);

  if (keys.length === 0) throw new Error("No Supadata API keys configured");

  let lastError;
  for (const key of keys) {
    try {
      const res = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=${lang ?? "en"}`, {
        headers: { "x-api-key": key }
      });

      if (res.status === 401 || res.status === 403 || res.status === 429) {
         console.warn(`Supadata key failed with status ${res.status}, trying next...`);
         continue;
      }

      if (!res.ok) throw new Error(`Supadata error: ${res.status}`);
      
      const data = await res.json();
      return {
        items: data.content.map(c => ({
          text: c.text,
          offset: c.offset,
          duration: c.duration,
          lang: data.lang
        })),
        metadata: { title: data.title ?? "", duration: data.duration ?? 0 }
      };
    } catch (err) {
      lastError = err;
      console.error(`Supadata attempt failed: ${err.message}`);
    }
  }

  throw lastError || new Error("All Supadata API keys failed");
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