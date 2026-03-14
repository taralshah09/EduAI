import { Link } from 'react-router-dom'
import './CourseCard.css'

export default function CourseCard({ course }) {
  const status = course.status

  return (
    <Link to={`/course/${course._id}`} className="course-card card">
      <div className="course-card-thumb">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} />
        ) : (
          <div className="course-card-thumb-placeholder">🎬</div>
        )}
        <span className={`course-status-badge badge ${status === 'ready' ? 'badge-green' : status === 'error' ? 'badge-red' : 'badge-purple'}`}>
          {status === 'ready' ? '✓ Ready' : status === 'error' ? '✗ Error' : '⏳ Processing'}
        </span>
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        <div className="course-card-meta">
          <span>📚 {course.lessonCount || 0} lessons</span>
          <span>🧩 {(course.lessonCount || 0) * 5} questions</span>
        </div>
      </div>
    </Link>
  )
}
