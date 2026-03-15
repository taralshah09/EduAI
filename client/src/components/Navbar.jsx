import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', show: !!user },
    { name: 'Generator', path: '/', show: true },
    { name: 'BYOK', path: '/byok', show: !!user },
  ]

  return (
    <header 
      className="p-6 md:px-10 flex flex-wrap justify-between items-center gap-6 bg-white border-b border-gray-100 sticky top-0 z-50"
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, background: 'white', padding: '1.5rem', borderBottom: '1px solid #e5e7eb', width: '100%', boxSizing: 'border-box' }}
    >
      <Link to="/" className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="w-10 h-10 bg-[#111827] rounded-full flex items-center justify-center shrink-0" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tighter text-[#111827]">EDU AI</span>
      </Link>

      <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-gray-500" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {navLinks.map((link) => link.show && (
          <Link
            key={link.path}
            to={link.path}
            className={`transition-colors hover:text-[#111827] ${
              pathname === link.path ? "text-[#111827] border-b-2 border-[#d9f99d]" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
        <a
          href="https://www.taralshah.xyz"
          target="_blank"
          rel="noopener noreferrer"
        >
          Builder
        </a>
      </nav>

      <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-500 hidden sm:block">Hi, {user.name}</span>
            <button
              onClick={logout}
              className="bg-[#111827] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold uppercase tracking-wider text-gray-500 hover:text-[#111827] transition-colors"
              style={{ marginRight: '1rem' }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-[#111827] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all font-sans"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
