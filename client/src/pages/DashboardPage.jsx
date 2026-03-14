import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import CourseCard from '../components/CourseCard'
import './DashboardPage.css'

export default function DashboardPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourses()
    const interval = setInterval(fetchCourses, 5000) // poll for processing courses
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
    <div className="dashboard-page">
      <Navbar />
      <div className="container dashboard-content">
        <div className="dashboard-header">
          <div>
            <h2>My Courses</h2>
            <p>{courses.length} course{courses.length !== 1 ? 's' : ''} generated</p>
          </div>
          <Link to="/" className="btn btn-primary">+ New Course</Link>
        </div>

        {hasProcessing && (
          <div className="processing-banner">
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
            <span>Some courses are still being generated... Auto-refreshing.</span>
          </div>
        )}

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading your courses...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">{error}</div>
        ) : courses.length === 0 ? (
          <div className="dashboard-empty">
            <span className="empty-icon">🎓</span>
            <h3>No courses yet</h3>
            <p>Paste a YouTube URL to generate your first AI course.</p>
            <Link to="/" className="btn btn-primary">Generate your first course →</Link>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
