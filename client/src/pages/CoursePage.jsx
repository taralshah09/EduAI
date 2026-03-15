import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
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

  useEffect(() => {
    if (!course || course.status !== 'processing') return
    const interval = setInterval(fetchCourse, 5000)
    return () => clearInterval(interval)
  }, [course, fetchCourse])

  if (loading) return <>
    <Navbar />
    <div className="flex-1 flex items-center justify-center p-20">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        <p className="text-lg font-bold uppercase tracking-widest text-gray-400">Loading Course...</p>
      </div>
    </div>
  </>

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Modal
        isOpen={showErrorModal}
        title="Oops! Something went wrong"
        message={error}
        onButtonClick={() => navigate('/')}
        buttonText="Back to Home"
      />
      <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-3xl border border-red-100 shadow-xl text-center">
        <h2 className="text-2xl font-black text-red-500 mb-4 uppercase tracking-tighter">⚠️ {error}</h2>
        <p className="text-gray-500 mb-8 font-medium">We encountered an issue while loading your course.</p>
        <Link to="/" className="inline-block px-10 py-4 bg-dark text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all">
          Back to Home
        </Link>
      </div>
    </div>
  )

  if (course.status === 'processing') return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="max-w-md w-full bg-white p-12 rounded-[32px] shadow-2xl border border-white text-center space-y-8">
           <div className="relative">
              <div className="w-24 h-24 border-[6px] border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
           </div>
           <div>
              <h2 className="text-3xl font-black text-dark tracking-tighter uppercase mb-2">Generating...</h2>
              <p className="text-sm font-medium text-gray-400 leading-relaxed">Our AI is reading the transcript and building your curriculum. This usually takes 30-60 seconds.</p>
           </div>
           <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full bg-primary animate-[shimmer_2s_infinite_linear]" style={{ width: '60%' }}></div>
           </div>
        </div>
      </div>
    </div>
  )

  const lesson = course.lessons[activeLesson]

  return (
    <div className="bg-surface text-accent min-h-screen flex flex-col font-sans lg:h-screen lg:overflow-hidden">
      <Navbar />
      
      <main className="course-layout-v2">
        {/* Column 1: Curriculum & Concepts */}
        <section className="col-left">
          {/* Lessons List */}
          <div className="bg-white border border-zinc-200 rounded-custom flex flex-col overflow-hidden shadow-sm lg:h-1/2">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="font-display font-extrabold text-xl uppercase italic tracking-tight">Curriculum</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1 truncate">{course.title}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-zinc-200">
              {course.lessons.map((l, i) => (
                <div 
                  key={i}
                  onClick={() => { setActiveLesson(i); setView('lesson') }}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    activeLesson === i 
                    ? 'bg-primary border-black/5 shadow-sm' 
                    : 'bg-zinc-50 border-transparent hover:border-zinc-200'
                  }`}
                >
                  <span className={`text-[10px] font-black block mb-1 ${activeLesson === i ? 'opacity-50' : 'text-zinc-400'}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className={`font-bold text-sm ${activeLesson === i ? 'text-black' : 'text-zinc-600'}`}>{l.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Concept Cards (Examples) */}
          {lesson.examples?.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-custom flex flex-col overflow-hidden shadow-sm lg:h-1/2">
              <div className="p-6 border-b border-zinc-100">
                <h4 className="font-display font-black text-xs uppercase tracking-[0.2em] text-zinc-400">Concept Cards</h4>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200">
                {lesson.examples.map((ex, i) => (
                  <div key={i} className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{i + 1}</span>
                    <p className="text-zinc-600 font-medium text-xs leading-relaxed">{ex}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-white border border-zinc-200 rounded-custom shadow-sm">
            <button 
              onClick={async () => {
                if (window.confirm("Delete this course?")) {
                  await api.delete(`/courses/${id}`);
                  navigate('/');
                }
              }}
              className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
            >
              Delete Course
            </button>
          </div>
        </section>

        {/* Column 2: Content Area */}
        <section className="col-middle">
          <div className="flex-1 overflow-y-auto p-8 pb-32 scrollbar-thin scrollbar-thumb-zinc-200">
            {view === 'lesson' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary text-accent text-[10px] font-black rounded-full uppercase tracking-tighter">Lesson {activeLesson + 1}</span>
                    {course.lessons[activeLesson].quiz?.length > 0 && (
                      <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Quiz Available</span>
                    )}
                  </div>
                  <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tighter uppercase leading-none text-accent">
                    {lesson.title}
                  </h1>
                  {lesson.summary && (
                    <div className="p-6 bg-zinc-50 border-l-4 border-primary rounded-r-3xl">
                      <p className="text-zinc-600 italic font-medium">{lesson.summary}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6 text-accent font-medium text-lg leading-relaxed prose prose-zinc max-w-none prose-headings:text-accent prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-p:text-zinc-600">
                  <MarkdownRenderer content={lesson.explanation} />
                </div>
              </div>
            ) : (
              <div className="h-full">
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

          {/* Fixed Footer Bar */}
          {view === 'lesson' && lesson.quiz?.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-sm">
              <button 
                onClick={() => setView('quiz')}
                className="w-full py-5 bg-accent text-primary font-black uppercase text-sm tracking-[0.2em] rounded-2xl hover:brightness-110 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
                Create Knowledge Quiz
              </button>
            </div>
          )}
        </section>

        {/* Column 3: AI Chat Interface */}
        <section className="col-right">
          <ChatWidget courseId={id} />
        </section>

      </main>
    </div>
  )
}
