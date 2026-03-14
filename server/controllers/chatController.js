import Chat from "../models/Chat.js";
import Course from "../models/Course.js";
import { answerQuestion } from "../services/geminiService.js";

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

    // Build transcript context: join all lesson transcripts
    const transcriptContext = course.lessons
      .map((l, i) => `[Lesson ${i + 1}: ${l.title}]\n${l.transcript || l.summary}`)
      .join("\n\n")
      .slice(0, 8000); // cap to avoid token overflow

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

    // Get answer from Gemini
    const answer = await answerQuestion(message, transcriptContext, historyOrdered);

    // Save assistant message
    await Chat.create({
      courseId,
      userId: req.user._id,
      role: "assistant",
      content: answer,
    });

    res.json({ answer });
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
