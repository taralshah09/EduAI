import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import CourseCard from '../components/CourseCard'

export default function DashboardPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
    const interval = setInterval(fetchCourses, 10000) // poll for processing courses
    return () => clearInterval(interval)
  }, [])

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses')
      setCourses(data.courses)
    } catch {
      setError('Failed to load courses.')
    } finally {
      setLoading(false)
    }
  }

  const hasProcessing = courses.some(c => c.status === 'processing')

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow p-6 md:p-10 w-full">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-dark uppercase tracking-tighter leading-none mb-2">My Library</h1>
            <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] ml-1">
              {courses.length} course{courses.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <Link
            to="/"
            className="w-full md:w-auto group bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-sm hover:brightness-105 transition-all shadow-lg flex items-center justify-center gap-3"
          >
            <span>+ New Course</span>
            <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center text-white scale-75 group-hover:scale-100 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
              </svg>
            </div>
          </Link>
        </div>

        {/* Processing Banner */}
        {hasProcessing && (
          <div className="bg-dark text-white p-4 rounded-3xl mb-12 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Building your courses in the background...</p>
          </div>
        )}

        {/* Courses Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-12 h-12 border-4 border-black/5 border-t-black/20 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Library...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-8 rounded-[32px] text-center">
            <p className="text-red-500 font-bold uppercase tracking-widest text-sm">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 p-20 rounded-[48px] text-center group hover:border-primary transition-colors cursor-pointer">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform">🎓</div>
            <h3 className="text-2xl font-black text-dark uppercase tracking-tighter mb-2">No courses yet</h3>
            <p className="text-gray-400 font-medium mb-8 max-w-sm mx-auto">Start your learning journey by pasting a YouTube URL to generate your first AI-powered course.</p>
            <Link to="/" className="inline-block bg-dark text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs">Generate your first course</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <CourseCard key={course._id} course={course} onDelete={() => fetchCourses()} />
            ))}
          </div>
        )}
      </main>

      <footer className="p-10 text-center">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-loose">
          TL;DR — <br className="md:hidden" /> REVOLUTIONIZING LEARNING ONE VIDEO AT A TIME
        </p>
      </footer>
    </div>
  )
}
