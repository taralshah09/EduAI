import Course from "../models/Course.js";

// POST /api/quiz/submit
export async function submitQuiz(req, res) {
  try {
    const { courseId, lessonIndex, answers } = req.body;
    // answers: array of selected option indices [0,2,1,3,0]

    if (!courseId || lessonIndex === undefined || !Array.isArray(answers)) {
      return res.status(400).json({ error: "courseId, lessonIndex, and answers are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const lesson = course.lessons[lessonIndex];
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const quiz = lesson.quiz;
    let score = 0;
    const results = quiz.map((q, i) => {
      const selected = answers[i] ?? -1;
      const isCorrect = selected === q.correct;
      if (isCorrect) score++;
      return {
        question: q.question,
        options: q.options,
        selected,
        correct: q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    res.json({
      score,
      total: quiz.length,
      percentage: Math.round((score / quiz.length) * 100),
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
