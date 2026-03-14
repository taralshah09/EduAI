import { Link } from 'react-router-dom'
import './Breadcrumbs.css'

export default function Breadcrumbs({ courseTitle, lessonTitle }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        <li className="breadcrumb-item">
          <Link to="/">Home</Link>
        </li>
        <li className="breadcrumb-item">
          <Link to="/dashboard">Courses</Link>
        </li>
        {courseTitle && (
          <li className="breadcrumb-item active" aria-current="page">
            {courseTitle}
          </li>
        )}
        {lessonTitle && (
          <li className="breadcrumb-item active" aria-current="page">
            {lessonTitle}
          </li>
        )}
      </ol>
    </nav>
  )
}
