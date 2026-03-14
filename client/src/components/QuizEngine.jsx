import { useState } from 'react'
import axios from 'axios'
import './QuizEngine.css'

export default function QuizEngine({ quiz, courseId, lessonIndex, lessonTitle, onBack }) {
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)

  const selectAnswer = (qIndex, optIndex) => {
    if (result) return // locked after submit
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.length) {
      alert('Please answer all questions before submitting.')
      return
    }
    setLoading(true)
    try {
      const answersArr = quiz.map((_, i) => answers[i] ?? -1)
      const { data } = await axios.post('http://localhost:3000/api/quiz/submit', {
        courseId,
        lessonIndex,
        answers: answersArr,
      })
      setResult(data)
      setCurrentQ(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setResult(null)
    setCurrentQ(0)
  }

  // Results screen
  if (result) {
    const pct = result.percentage
    const grade = pct >= 80 ? '🏆 Excellent!' : pct >= 60 ? '👍 Good job!' : '📖 Keep learning!'
    return (
      <div className="quiz-engine fade-in">
        <div className="quiz-score-header">
          <div className="quiz-score-circle">
            <span className="quiz-score-num">{pct}%</span>
            <span className="quiz-score-label">{result.score}/{result.total}</span>
          </div>
          <h2>{grade}</h2>
          <p>You got {result.score} out of {result.total} questions correct on <strong>{lessonTitle}</strong></p>
        </div>

        <div className="quiz-results-list">
          {result.results.map((r, i) => (
            <div key={i} className={`quiz-result-item ${r.isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="quiz-result-header">
                <span className="quiz-result-icon">{r.isCorrect ? '✓' : '✗'}</span>
                <span className="quiz-q-num">Q{i + 1}</span>
                <p className="quiz-q-text">{r.question}</p>
              </div>
              <div className="quiz-result-options">
                {r.options.map((opt, oi) => (
                  <div key={oi} className={`result-option ${oi === r.correct ? 'is-correct' : ''} ${oi === r.selected && !r.isCorrect ? 'is-wrong' : ''}`}>
                    {opt}
                  </div>
                ))}
              </div>
              <div className="quiz-explanation">
                <span>💡</span> {r.explanation}
              </div>
            </div>
          ))}
        </div>

        <div className="quiz-actions">
          <button className="btn btn-secondary" onClick={handleRetry}>🔄 Retry Quiz</button>
          <button className="btn btn-primary" onClick={onBack}>← Back to Lesson</button>
        </div>
      </div>
    )
  }

  // Questions screen
  const q = quiz[currentQ]
  const totalAnswered = Object.keys(answers).length

  return (
    <div className="quiz-engine fade-in">
      <div className="quiz-top">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <span className="quiz-progress-text">Question {currentQ + 1} of {quiz.length}</span>
      </div>

      <div className="quiz-progress-bar progress-track">
        <div className="progress-fill" style={{ width: `${((currentQ + 1) / quiz.length) * 100}%` }}></div>
      </div>

      <div className="quiz-question-card card">
        <h3 className="quiz-question">{q.question}</h3>
        <div className="quiz-options">
          {q.options.map((opt, oi) => (
            <button
              key={oi}
              className={`quiz-option ${answers[currentQ] === oi ? 'selected' : ''}`}
              onClick={() => selectAnswer(currentQ, oi)}
            >
              <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="quiz-nav">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >
          ← Prev
        </button>

        {currentQ < quiz.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setCurrentQ(q => q + 1)}
            disabled={answers[currentQ] === undefined}
          >
            Next →
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || totalAnswered < quiz.length}
          >
            {loading ? 'Submitting...' : `Submit (${totalAnswered}/${quiz.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
