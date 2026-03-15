import { Link } from 'react-router-dom'
import api from '../services/api'
import './CourseCard.css'

export default function CourseCard({ course, onDelete }) {
  const status = course.status

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.delete(`/courses/${course._id}`);
      if (onDelete) onDelete();
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course.");
    }
  };

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
        <div className="course-card-header">
          <h3 className="course-card-title">{course.title}</h3>
          <button className="btn-icon btn-delete-course" onClick={handleDelete} title="Delete Course">
            🗑️
          </button>
        </div>
        <div className="course-card-meta">
          <span>📚 {course.lessonCount || 0} lessons</span>
          <span>🧩 {(course.lessonCount || 0) * 5} questions</span>
        </div>
      </div>
    </Link>
  )
}
