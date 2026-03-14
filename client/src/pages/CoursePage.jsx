import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Breadcrumbs from '../components/Breadcrumbs'
import QuizEngine from '../components/QuizEngine'
import ChatWidget from '../components/ChatWidget'
import MarkdownRenderer from '../components/MarkdownRenderer'
import Loader from '../components/Loader'
import Modal from '../components/Modal'
import './CoursePage.css'

export default function CoursePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [activeLesson, setActiveLesson] = useState(0)
  const [view, setView] = useState('lesson') // 'lesson' | 'quiz'

  const fetchCourse = useCallback(async () => {
    try {
      const { data } = await api.get(`/courses/${id}`)
      setCourse(data.course)
      if (data.course.status === 'error') {
        setError(data.course.errorMessage || 'Course generation failed.')
        setShowErrorModal(true)
      }
    } catch {
      setError('Course not found.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  // Poll while processing
  useEffect(() => {
    if (!course || course.status !== 'processing') return
    const interval = setInterval(fetchCourse, 5000)
    return () => clearInterval(interval)
  }, [course, fetchCourse])

  // Remove the old redirect timer, we will use the modal instead
  /*
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, navigate])
  */

  if (loading) return <><Navbar /><Loader message="Loading your course..." /></>

  if (error) return (
    <div>
      <Navbar />
      <Modal
        isOpen={showErrorModal}
        title="Oops! Something went wrong"
        message={error}
        onButtonClick={() => navigate('/')}
        buttonText="Back to Home"
      />
      <div className="course-error">
        <h2>⚠️ {error}</h2>
        <p>Please click the button above to return home.</p>
        <Link to="/" className="btn btn-secondary">← Back to Home</Link>
      </div>
    </div>
  )

  if (course.status === 'processing') return (
    <><Navbar /><Loader message="Generating your course with AI..." /></>
  )

  const lesson = course.lessons[activeLesson]

  return (
    <div className="course-page">
      <Navbar />

      <div className="course-layout-v2">
        {/* LEFT COLUMN: Navigation / Context */}
        <aside className="col-left">
          <div className="col-header">
            <Breadcrumbs courseTitle={course.title} lessonTitle={lesson.title} />
            <h2 className="video-title">{lesson.title}</h2>
          </div>
          
          <div className="concepts-section">
            <h4 className="section-label">Concepts Cards</h4>
            <div className="concepts-scroll-area">
              {lesson.concepts?.map((c, i) => (
                <div key={i} className="concept-card">
                  <span className="concept-card-icon">💡</span>
                  <div className="concept-card-content">
                    <h5>{c}</h5>
                    <p>Key concept from this lesson</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-footer">
            <nav className="mini-lesson-nav">
              {course.lessons.map((l, i) => (
                <button
                  key={i}
                  className={`mini-nav-item ${activeLesson === i ? 'active' : ''}`}
                  onClick={() => { setActiveLesson(i); setView('lesson') }}
                  title={l.title}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* MIDDLE COLUMN: Lesson Content */}
        <main className="col-middle">
          <div className="col-header">
            <span className="lesson-num-badge">Lesson {activeLesson + 1}</span>
            <h1 className="lesson-title-v2">{lesson.title}</h1>
          </div>

          <div className="col-middle-scroll">
            {view === 'lesson' ? (
              <div className="lesson-content-v2">
                <div className="scrollable-concept-content">
                  <h4 className="section-label">Concept Content</h4>
                  <div className="explanation-text">
                    <MarkdownRenderer content={lesson.explanation} />
                  </div>
                </div>

                {lesson.examples?.length > 0 && (
                  <div className="examples-section-v2">
                    <h4 className="section-label">Examples</h4>
                    <div className="examples-list-v2">
                      {lesson.examples.map((ex, i) => (
                        <div key={i} className="example-card">
                          <span className="example-badge">{i + 1}</span>
                          <p>{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {lesson.quiz?.length > 0 && (
                  <div className="quiz-cta-v2">
                    <button className="btn btn-primary btn-lg" onClick={() => setView('quiz')}>
                      Create Quiz & Test Knowledge
                    </button>
                  </div>
                )}
              </div>
            ) : (

            <div className="quiz-container-v2">
              <QuizEngine
                quiz={lesson.quiz}
                courseId={id}
                lessonIndex={activeLesson}
                lessonTitle={lesson.title}
                onBack={() => setView('lesson')}
              />
            </div>
          )}
          </div>
        </main>


        {/* RIGHT COLUMN: AI Tutor */}
        <aside className="col-right">
          <div className="col-header">
            <h4 className="ai-tutor-title">AI Tutor – Assignment Help</h4>
          </div>
          
          <div className="chat-scroll-container">
            <ChatWidget courseId={id} />
          </div>
        </aside>
      </div>
    </div>
  )
}
