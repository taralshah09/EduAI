import Course from "../models/Course.js";
import {
  extractVideoId,
  fetchTranscript,
  chunkTranscript,
  joinTranscript,
} from "./transcriptService.js";
import {
  generateLessonContent,
  generateQuiz,
  generateCourseTitle,
  checkContentSafety,
} from "./geminiService.js";

/**
 * Main pipeline: YouTube URL → structured Course saved in MongoDB
 */
export async function buildCourse(url) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  // Check if course already exists
  const existing = await Course.findOne({ videoId });
  if (existing && existing.status === "ready") return existing;

  // Create a placeholder so we can return the ID immediately
  const course = existing || new Course({ videoId, title: "Processing...", url, status: "processing" });
  if (!existing) await course.save();

  // Run async pipeline (fire-and-forget, updates DB when done)
  processCourse(course, videoId, url).catch(async (err) => {
    console.error("Course generation error:", err.message);
    await Course.findByIdAndUpdate(course._id, {
      status: "error",
      errorMessage: err.message,
    });
  });

  return course;
}

async function processCourse(course, videoId, url) {
  // 1. Fetch transcript and metadata
  let transcriptData;
  try {
    transcriptData = await fetchTranscript(videoId);
  } catch (err) {
    throw new Error(`Could not fetch transcript: ${err.message}. Make sure the video has captions enabled.`);
  }

  const { items: transcriptItems, metadata } = transcriptData;

  // 1b. Validate Duration (max 30 minutes = 1800 seconds)
  if (metadata.duration > 1800) {
    throw new Error(`Video is too long (${Math.round(metadata.duration / 60)} minutes). Max allowed length is 30 minutes.`);
  }

  const fullText = joinTranscript(transcriptItems);
  if (!fullText || fullText.length < 100) {
    throw new Error("Transcript is too short or empty.");
  }

  // 1c. Content Safety Check
  console.log(`[Safety] Checking content for video: ${metadata.title}...`);
  const safety = await checkContentSafety(fullText);
  if (!safety.isSafe) {
    throw new Error(`Inappropriate content detected: ${safety.reason || "NSFW content"}`);
  }

  // 2. Generate course title
  const title = metadata.title || (await generateCourseTitle(fullText));

  // 3. Chunk transcript into lessons (max 6 lessons for reasonable API usage)
  const chunks = chunkTranscript(transcriptItems, 700);
  const limitedChunks = chunks.slice(0, 6);

  // 4. Generate content for each chunk in sequence (to avoid rate limiting)
  const lessons = [];
  for (const chunk of limitedChunks) {
    // Add small delay to stay within RPM limits
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let lessonData;
    try {
      lessonData = await generateLessonContent(chunk.text, chunk.chunkIndex);
    } catch (err) {
      console.error(`Lesson ${chunk.chunkIndex} generation error:`, err.message);
      lessonData = {
        title: `Lesson ${chunk.chunkIndex + 1}`,
        summary: "Content generation failed for this section.",
        concepts: [],
        explanation: chunk.text.slice(0, 500),
        examples: [],
      };
    }

    // Small delay between lesson and quiz
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 5. Generate quiz for this lesson
    let quiz = [];
    try {
      quiz = await generateQuiz(
        lessonData.title,
        `${lessonData.summary}\n${lessonData.explanation}`
      );
    } catch (err) {
      console.error(`Quiz generation error for lesson ${chunk.chunkIndex}:`, err.message);
    }

    lessons.push({
      ...lessonData,
      transcript: chunk.text, // store chunk for RAG in chat
      quiz,
    });
  }

  // 6. Build YouTube thumbnail URL
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  // 7. Update Course in DB
  await Course.findByIdAndUpdate(course._id, {
    title,
    thumbnail,
    lessons,
    status: "ready",
    errorMessage: null,
  });

  console.log(`✅ Course ready: "${title}" (${lessons.length} lessons)`);
}
