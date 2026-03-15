import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', show: !!user },
    { name: 'Generator', path: '/', show: true },
    { name: 'BYOK', path: '/byok', show: !!user },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 w-full">
      <div className="max-w-[1440px] mx-auto p-4 md:px-10 flex justify-between items-center bg-white">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <span className="text-xl font-bold tracking-tighter text-dark">TL;DR</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-gray-500">
          {navLinks.map((link) => link.show && (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors hover:text-dark relative py-1 ${pathname === link.path ? "text-dark" : ""
                }`}
            >
              {link.name}
              {pathname === link.path && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>
              )}
            </Link>
          ))}
          <a
            href="https://www.taralshah.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#111827]"
          >
            Builder
          </a>
        </nav>

        {/* Auth Actions (Desktop) & Hamburger Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-500">Hi, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-dark text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold uppercase tracking-wider text-gray-500 hover:text-dark transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-dark text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 text-dark hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] border-t border-gray-100' : 'max-h-0'}`}>
        <div className="p-6 space-y-6 bg-white shadow-xl">
          <nav className="flex flex-col gap-4 text-sm font-bold uppercase tracking-widest text-gray-500">
            {navLinks.map((link) => link.show && (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`transition-colors hover:text-dark ${pathname === link.path ? "text-dark flex items-center gap-2" : ""
                  }`}
              >
                {link.name}
                {pathname === link.path && <span className="w-2 h-2 rounded-full bg-primary"></span>}
              </Link>
            ))}
            <a
              href="https://www.taralshah.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-dark"
            >
              Builder
            </a>
          </nav>

          <div className="pt-6 border-t border-gray-100 sm:hidden">
            {user ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Logged in as {user.name}</p>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full bg-dark text-white px-6 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  Logout
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center px-6 py-4 rounded-2xl border border-gray-200 text-sm font-bold uppercase tracking-widest text-dark hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center bg-dark text-white px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-gray-800"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
