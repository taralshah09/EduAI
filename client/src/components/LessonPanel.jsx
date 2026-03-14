import './LessonPanel.css'

export default function LessonPanel({ lesson, lessonIndex, onStartQuiz }) {
  if (!lesson) return null

  return (
    <div className="lesson-panel fade-in">
      <div className="lesson-header">
        <span className="lesson-number badge badge-purple">Lesson {lessonIndex + 1}</span>
        <h2 className="lesson-title">{lesson.title}</h2>
      </div>

      {/* Summary */}
      <section className="lesson-section">
        <h4 className="section-label">📋 Summary</h4>
        <p className="lesson-summary">{lesson.summary}</p>
      </section>

      {/* Key Concepts */}
      {lesson.concepts?.length > 0 && (
        <section className="lesson-section">
          <h4 className="section-label">🔑 Key Concepts</h4>
          <div className="concepts-grid">
            {lesson.concepts.map((c, i) => (
              <span key={i} className="concept-chip">{c}</span>
            ))}
          </div>
        </section>
      )}

      {/* Explanation */}
      {lesson.explanation && (
        <section className="lesson-section">
          <h4 className="section-label">💡 Explanation</h4>
          <div className="lesson-explanation">
            {lesson.explanation.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Examples */}
      {lesson.examples?.length > 0 && (
        <section className="lesson-section">
          <h4 className="section-label">🧪 Examples</h4>
          <div className="examples-list">
            {lesson.examples.map((ex, i) => (
              <div key={i} className="example-item">
                <span className="example-num">{i + 1}</span>
                <p>{ex}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quiz CTA */}
      {lesson.quiz?.length > 0 && (
        <div className="lesson-quiz-cta">
          <div className="quiz-cta-info">
            <span className="quiz-cta-icon">🧩</span>
            <div>
              <h4>Test your knowledge</h4>
              <p>{lesson.quiz.length} multiple choice questions</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={onStartQuiz}>
            Take Quiz →
          </button>
        </div>
      )}
    </div>
  )
}
