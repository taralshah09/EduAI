import Chat from "../models/Chat.js";
import Course from "../models/Course.js";
import { answerQuestion } from "../ai/ContentGenerator.js";
import { retrieve } from "../ai/RAGService.js";

// POST /api/chat
export async function chat(req, res) {
  try {
    const { courseId, message } = req.body;
    if (!courseId || !message) {
      return res.status(400).json({ error: "courseId and message are required" });
    }

    // Load course for transcript context
    const course = await Course.findOne({ _id: courseId, userId: req.user._id });
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Build chunk list from lesson transcripts for RAG retrieval
    const chunks = course.lessons
      .filter((l) => l.transcript || l.summary)
      .map((l, i) => ({
        chunkIndex: i,
        text: `[Lesson ${i + 1}: ${l.title}]\n${l.transcript || l.summary}`,
      }));

    // Use RAG to retrieve only the most relevant chunks (semantic search)
    // Falls back gracefully to the first 3 chunks if embedding fails
    let transcriptContext;
    try {
      transcriptContext = await retrieve(message, courseId, chunks, 3);
    } catch (ragErr) {
      console.warn("[Chat] RAG retrieval failed, using fallback context:", ragErr.message);
      transcriptContext = chunks
        .slice(0, 3)
        .map((c) => c.text)
        .join("\n\n---\n\n");
    }

    // Load recent chat history
    const history = await Chat.find({ courseId, userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    const historyOrdered = history.reverse();

    // Save user message
    await Chat.create({
      courseId,
      userId: req.user._id,
      role: "user",
      content: message,
    });

    let warning = null;
    let userKeyFailed = false;
    const onUserKeyFailure = async (reason) => {
      if (userKeyFailed) return;
      userKeyFailed = true;
      // For now, we mainly handle Gemini failure callback
      await import("../models/User.js").then(({ default: User }) => 
        User.findByIdAndUpdate(req.user._id, { $unset: { "gemini.apiKey": "" } })
      ).catch(e => console.error("User key unset error:", e.message));
      warning = `⚠️ **Notice:** Your personal API key failed (${reason}). We've fallen back to the system default key and removed your invalid key.`;
    };

    // Get answer from AI
    const answer = await answerQuestion(message, transcriptContext, historyOrdered, req.user, onUserKeyFailure);

    // Save assistant message
    await Chat.create({
      courseId,
      userId: req.user._id,
      role: "assistant",
      content: answer,
    });

    res.json({ answer, warning });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/chat/:courseId  — load chat history
export async function getChatHistory(req, res) {
  try {
    const messages = await Chat.find({
      courseId: req.params.courseId,
      userId: req.user._id,
    })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
