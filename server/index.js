import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Controllers
import {
  generateCourse,
  getAllCourses,
  getCourseById,
  getCourseStatus,
} from "./controllers/courseController.js";
import { chat, getChatHistory } from "./controllers/chatController.js";
import { submitQuiz } from "./controllers/quizController.js";

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// DB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.get("/", (req, res) => res.json({ message: "MiyagiLabs API 🚀" }));

// Courses
app.post("/api/courses/generate", generateCourse);
app.get("/api/courses", getAllCourses);
app.get("/api/courses/status/:id", getCourseStatus);
app.get("/api/courses/:id", getCourseById);

// Chat
app.post("/api/chat", chat);
app.get("/api/chat/:courseId", getChatHistory);

// Quiz
app.post("/api/quiz/submit", submitQuiz);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);