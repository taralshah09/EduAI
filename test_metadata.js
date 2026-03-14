import { fetchTranscript, extractVideoId } from './server/services/transcriptService.js';

async function test() {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const videoId = extractVideoId(url);
    console.log("Video ID:", videoId);
    
    try {
        const transcript = await fetchTranscript(videoId);
        if (transcript && transcript.length > 0) {
            const lastItem = transcript[transcript.length - 1];
            const durationSeconds = lastItem.offset + lastItem.duration;
            console.log("Transcript-based duration (seconds):", durationSeconds);
            console.log("Transcript-based duration (minutes):", durationSeconds / 60);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

test();
