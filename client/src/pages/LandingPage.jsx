import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const isValidYouTube = (u) => /youtube\.com\/watch|youtu\.be\//.test(u)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!user) {
      return navigate('/login')
    }
    if (!url.trim()) return setError('Please enter a YouTube URL.')
    if (!isValidYouTube(url)) return setError('Please enter a valid YouTube URL.')

    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/courses/generate', { url })
      navigate(`/course/${data.course._id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate course. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#f3f4f6] text-[#111827] font-sans min-h-screen flex flex-col">
      <div className="w-full bg-white flex flex-col grow shadow-sm">
        <Navbar />

        <main className="grow p-6 md:px-10 pb-10" style={{ display: 'flex', flexDirection: 'column', grow: 1 }}>
          <div className="grid grid-cols-12 gap-6 bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            {/* Main Hero / Input Section */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8" style={{ gridColumn: 'span 12 / span 12', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-[#111827] leading-[0.9] tracking-[-0.05em] uppercase">
                  REVOLUTIONIZE <br />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5em' }}>
                    <span>LEARNING</span>
                    <span className="inline-block px-6 py-2 border border-gray-300 rounded-full text-lg md:text-2xl font-normal lowercase tracking-normal italic">with</span>
                    <span>AI-DRIVEN EDUCATION</span>
                  </div>
                </h1>
              </div>

              {/* URL Input Bento Box */}
              <form 
                onSubmit={handleGenerate}
                className="bg-gray-100 rounded-[24px] p-6 border-[1.5px] border-gray-200 flex flex-col md:flex-row items-center gap-4"
              >
                <div className="grow w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-4">Source URL</label>
                  <div className="flex items-center bg-white rounded-full px-6 py-3 border border-gray-200 focus-within:border-[#d9f99d] transition-colors relative">
                    <svg width="24" height="24" className="w-6 h-6 text-red-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ minWidth: '24px', minHeight: '24px' }}>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path>
                    </svg>
                    <input
                      type="text"
                      className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium"
                      placeholder="Paste YouTube Video URL here..."
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError('') }}
                      disabled={loading}
                    />
                  </div>
                  {error && <p className="text-red-500 text-[10px] font-bold mt-1 ml-4 uppercase tracking-wider">{error}</p>}
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto mt-4 md:mt-5 bg-[#d9f99d] text-[#111827] font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                  </svg>
                </button>
              </form>
            </div>

            {/* Right Side Promo Card */}
            <div className="col-span-12 lg:col-span-4 bg-[#111827] rounded-[24px] p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="relative z-10 flex justify-between items-start">
                <span className="px-4 py-1.5 rounded-full border border-gray-600 text-xs font-bold uppercase tracking-widest">Welcome</span>
                <div className="text-4xl">✱</div>
              </div>
              <div className="relative z-10 space-y-4">
                <p className="text-gray-400 text-sm leading-relaxed max-w-[240px]">
                  Discover a new way of learning with our AI-powered online platform. Achieve your goals and succeed with us.
                </p>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111827] bg-gray-600 flex items-center justify-center text-[10px] font-bold">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-[#d9f99d] flex items-center justify-center text-[10px] text-[#111827] font-black">+12</div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tr from-[#d9f99d]/10 to-transparent rounded-full -mb-10 -mr-10 blur-2xl"></div>
            </div>

            {/* Course Content - Secondary Grid Row */}
            <div className="col-span-12 md:col-span-4 space-y-6">
              {/* Stats Bento Box */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-100 p-8 rounded-[24px] border-[1.5px] border-gray-200 text-center">
                  <div className="text-4xl font-black mb-1">137</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Courses</div>
                </div>
                <div className="bg-[#111827] p-8 rounded-[24px] text-white text-center">
                  <div className="text-4xl font-black mb-1">12k</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Learners</div>
                </div>
              </div>
              {/* Abstract Graphic/Status Card */}
              <div className="bg-white border-[1.5px] border-gray-200 rounded-[24px] p-6 relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg width="24" height="24" className="w-6 h-6 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-400">SYS_V2.4</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Analysis Engine</h3>
                <p className="text-xs text-gray-500 leading-relaxed">Neural analysis of visual and auditory stems is currently operational.</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Active</span>
                </div>
              </div>
            </div>

            {/* Flexible Bento (The Main Content Area) */}
            <div className="col-span-12 md:col-span-8 bg-[#d9f99d] rounded-[24px] p-8 md:p-10 flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-1.5 rounded-full bg-[#111827] text-white text-[10px] font-bold uppercase tracking-widest">Modules Ready</span>
                  <span className="px-4 py-1.5 rounded-full border border-[#111827]/20 text-[#111827] text-[10px] font-bold uppercase tracking-widest">Takeaways Generated</span>
                  <span className="px-4 py-1.5 rounded-full border border-[#111827]/20 text-[#111827] text-[10px] font-bold uppercase tracking-widest">AI Quiz</span>
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-black text-[#111827] tracking-tighter">Flexible</h2>
                  <div className="h-[1.5px] bg-[#111827]/10 w-full"></div>
                  <div className="space-y-4 mt-6">
                    <div className="bg-white/40 border border-[#111827]/5 p-4 rounded-2xl flex items-center justify-between hover:bg-white/60 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-xs">01</div>
                        <span className="font-bold text-[#111827]">Introduction to Neural Networks</span>
                      </div>
                      <svg width="20" height="20" className="w-5 h-5 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
                      </svg>
                    </div>
                    <div className="bg-[#111827] text-white p-6 rounded-2xl">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#d9f99d]">Key Takeaways</span>
                      </div>
                      <ul className="text-sm space-y-2 font-medium">
                        <li className="flex gap-2"><span>•</span> Backpropagation backbone analysis</li>
                        <li className="flex gap-2"><span>•</span> Visualizing gradient descent</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end mt-12">
                <p className="text-[#111827]/60 text-sm font-medium leading-relaxed max-w-sm">
                  Our cutting-edge technology adapts to your needs and provides a tailored curriculum that helps you succeed.
                </p>
                <div className="w-20 h-20 bg-[#111827] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg width="40" height="40" className="w-10 h-10 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-10 py-8 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex gap-6">
            <a className="hover:text-[#111827]" href="#">Terms</a>
            <a className="hover:text-[#111827]" href="#">Privacy</a>
            <a className="hover:text-[#111827]" href="#">API Docs</a>
          </div>
          <div>© 2025 EDU AI LABS</div>
        </footer>
      </div>
    </div>
  )
}
