import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="container flex-between navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon-wrapper">
            <svg className="logo-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
          </div>
          <span className="logo-text">EduAI</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        </div>

        <Link to="/dashboard" className="btn btn-primary btn-sm">
          My Courses
        </Link>
      </div>
    </nav>
  )
}
