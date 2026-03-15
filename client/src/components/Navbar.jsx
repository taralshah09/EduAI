import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="container flex-between navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="logo-icon-wrapper">
            <svg
              className="logo-icon-svg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              ></path>
            </svg>
          </div>
          <span className="logo-text">EduAI</span>
        </Link>

        <div className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link
              to="/byok"
              className={`nav-link ${pathname === "/byok" ? "active" : ""}`}
            >
              BYOK
            </Link>
          )}
          <a
            href="https://www.taralshah.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            Builder
          </a>
        </div>

        <div className="navbar-actions">
          {user ? (
            <div className="user-profile">
              <span className="user-name">Hi, {user.name}</span>
              <button onClick={logout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-ghost btn-sm">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
