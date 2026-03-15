import Course from "../models/Course.js";
import { buildCourse } from "../services/courseService.js";

// POST /api/courses/generate
export async function generateCourse(req, res) {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "YouTube URL is required" });

    const course = await buildCourse(url, req.user._id, req.user);
    res.status(200).json({ course });
  } catch (err) {
    console.error("generateCourse error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

// GET /api/courses
export async function getAllCourses(req, res) {
  try {
    const courses = await Course.find({ userId: req.user._id })
      .select("videoId title url thumbnail status createdAt lessons")
      .sort({ createdAt: -1 });

    // Add lesson count and quiz count metadata
    const withMeta = courses.map((c) => ({
      _id: c._id,
      videoId: c.videoId,
      title: c.title,
      url: c.url,
      thumbnail: c.thumbnail,
      status: c.status,
      createdAt: c.createdAt,
      lessonCount: c.lessons?.length || 0,
    }));

    res.json({ courses: withMeta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/courses/:id
export async function getCourseById(req, res) {
  try {
    const course = await Course.findOne({ _id: req.params.id, userId: req.user._id });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/courses/status/:id  — poll for status during processing
export async function getCourseStatus(req, res) {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select("status title errorMessage lessonCount warningMessage");
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({
      status: course.status,
      title: course.title,
      errorMessage: course.errorMessage,
      warningMessage: course.warningMessage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/courses/:id
export async function deleteCourse(req, res) {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
