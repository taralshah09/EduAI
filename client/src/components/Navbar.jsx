import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const navLinks = [
    { name: 'Home', path: '/', show: true },
    { name: 'Dashboard', path: '/dashboard', show: !!user },
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
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
                  className="flex items-center gap-3 hover:bg-gray-50 p-1 pr-4 rounded-full transition-all border border-transparent hover:border-gray-200 active:scale-95 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-dark font-black text-lg shadow-sm border border-gray-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-dark">{user.name}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-sm font-black text-dark truncate">{user.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1 truncate">{user.email || 'Learner Account'}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4-4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="bg-primary text-dark px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest hover:brightness-105 transition-all active:scale-95 shadow-sm"
                >
                  Let's do it
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
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-dark font-black text-xl shadow-sm border border-gray-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-dark font-bold">{user.name}</p>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Logged in</p>
                  </div>
                </div>
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
              <div className="grid grid-cols-1 gap-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center bg-primary text-dark px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:brightness-105 shadow-sm"
                >
                  Let's do it
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
