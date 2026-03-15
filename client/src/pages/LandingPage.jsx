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
    <div className="bg-surface text-dark font-sans min-h-screen flex flex-col">
      <div className="w-full bg-white flex flex-col grow shadow-sm">
        <Navbar />

        <main className="grow p-6 md:px-10 pb-20 flex flex-col gap-16 md:gap-24">

          {/* HERO SECTION - BENTO GRID */}
          <section className="grid grid-cols-12 gap-6 pt-8 md:pt-12">
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-dark leading-[0.9] tracking-[-0.05em] uppercase">
                  STOP <br />
                  <span className="text-primary">WATCHING.</span><br />
                  START <br />
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <span>KNOWING</span>
                    <span className="px-4 md:px-6 py-1 md:py-2 border border-gray-300 rounded-full text-sm md:text-2xl font-normal lowercase tracking-normal italic flex items-center justify-center">
                      with
                    </span>
                    <span className="text-dark">TL<span className="text-primary">;</span>DR</span>
                  </div>
                </h1>
                <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-lg mt-4">
                  Turn any YouTube video into a structured course — with lessons, quizzes, and an AI tutor — in seconds.
                </p>
              </div>

              {/* URL Input Bento Box */}
              <form
                onSubmit={handleGenerate}
                className="bg-gray-100 rounded-[24px] p-6 border-[1.5px] border-gray-200 flex flex-col md:flex-row items-center gap-4"
              >
                <div className="grow w-full">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 ml-4">Source URL</label>
                  <div className="flex items-center bg-white rounded-full px-6 py-3 border border-gray-200 focus-within:border-primary transition-colors relative">
                    <svg width="24" height="24" className="w-6 h-6 text-red-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
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
                  className="w-full md:w-auto mt-4 md:mt-5 bg-primary text-dark font-black px-8 py-4 rounded-full uppercase tracking-tighter text-lg hover:brightness-105 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? 'Generating...' : 'Generate'}
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                  </svg>
                </button>
              </form>
            </div>
            {/* Right Side: Promo Card + Powered By stacked */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:min-h-full">

              {/* Dark Promo Card */}
              <div className="bg-dark rounded-[24px] p-10 text-white relative overflow-hidden flex flex-col justify-between flex-1 border border-gray-800 shadow-xl group">
                {/* Asterisk Background Overlay */}
                <div className="absolute top-0 right-0 -mr-4 -mt-4 text-white/5 group-hover:text-white/10 transition-colors duration-700 pointer-events-none z-0">
                  <svg width="220" height="220" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="3.34" y1="7" x2="20.66" y2="17" />
                    <line x1="3.34" y1="17" x2="20.66" y2="7" />
                  </svg>
                </div>

                <div className="relative z-10 flex justify-between items-start">
                  <span className="px-5 py-2 rounded-full border border-primary/20 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 backdrop-blur-sm">Active Learning Engine</span>
                </div>

                <div className="relative z-10 mt-auto pt-10">
                  <h3 className="text-3xl font-bold mb-3 text-primary uppercase tracking-tighter">From Video to Mastery</h3>
                  <p className="font-mono text-sm leading-relaxed text-gray-400 max-w-[320px]">
                    Paste a URL and instantly receive a structured curriculum, complete with quizzes and an interactive AI tutor.
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -mt-20 -mr-20 pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
              </div>

              {/* Powered By — dark-themed */}
              <div className="bg-dark rounded-[24px] p-8 flex flex-col gap-6 flex-1 border border-gray-800 shadow-lg justify-center">
                <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">Powered By Multi-Modal AI Stack</span>
                <div className="flex flex-wrap gap-3">
                  {['Gemini 2.5', 'Groq (LLaMA 3)', 'OpenRouter', 'Together AI', 'React', 'Node.js', 'MongoDB'].map((tech) => (
                    <span key={tech} className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-lg font-mono text-xs font-bold tracking-wide hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-colors cursor-default">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </section>

          <hr className="border-gray-200" />

          {/* PROBLEM SECTION */}
          <section className="bg-primary rounded-[32px] p-8 md:p-12 flex flex-col shadow-sm border border-primary/20 hover:border-primary/50 transition-colors">
            <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
              <span className="bg-dark text-primary px-3 py-1.5 md:px-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none flex items-center justify-center">The Problem</span>
              <span className="border border-dark/20 text-dark px-3 py-1.5 md:px-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none flex items-center justify-center">Passive Learning</span>
              <span className="border border-dark/20 text-dark px-3 py-1.5 md:px-4 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest leading-none flex items-center justify-center">Low Retention</span>
            </div>

            <h2 className="text-[11vw] sm:text-7xl md:text-8xl lg:text-[100px] font-black text-dark tracking-tighter mb-4 md:mb-6 leading-[0.85] md:leading-[0.85] uppercase">
              Tutorial Hell
            </h2>

            <hr className="border-dark/10 my-4 md:my-6" />

            <div className="flex flex-col gap-3 md:gap-4 mb-10 md:mb-16 mt-2">
              {/* Card 1: Information Firehose */}
              <div className="bg-white/40 rounded-[16px] md:rounded-[20px] p-4 md:p-6 flex items-center justify-between transition-colors hover:bg-white/60">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="bg-dark text-primary w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0">01</div>
                  <span className="font-bold text-dark text-sm md:text-lg">Information Firehose: Videos aren't paced for your brain</span>
                </div>
                <svg className="w-5 h-5 md:w-6 md:h-6 text-dark opacity-50 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Card 2: Passive Watching - Dark */}
              <div className="bg-dark text-white rounded-[16px] md:rounded-[20px] p-5 md:p-8 shadow-md">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-0 text-primary">Passive Watching ≠ Learning</span>
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <ul className="space-y-3 md:space-y-4 text-xs md:text-base text-gray-300 font-medium ml-1">
                  <li className="flex items-start gap-3">
                    <span className="text-white font-bold mt-0.5">•</span>
                    You open a 45-minute tutorial. You watch the whole thing. You feel productive.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-white font-bold mt-0.5">•</span>
                    Then you close the tab — and realize you can't remember half of what you just saw.
                  </li>
                </ul>
              </div>

              {/* Card 3: Re-watch Loop - Dashed */}
              <div className="border-[1.5px] border-dashed border-dark/20 rounded-[16px] md:rounded-[20px] p-4 md:p-6 flex items-center gap-4 bg-transparent transition-colors hover:bg-white/10">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-[3px] border-dark/20 border-t-dark animate-spin shrink-0"></div>
                <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest text-dark/70 italic leading-snug">The "Save for Later" Graveyard is growing... 10% retained</span>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 md:gap-8 mt-auto">
              <p className="text-dark/70 font-medium text-sm md:text-lg max-w-xl leading-relaxed">
                <strong className="text-dark font-black">That's not laziness. That's just how passive learning works.</strong> Research shows that without active engagement, retention drops to as low as 10%. You hit pause. You scrub back. The knowledge doesn't stick.
              </p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-dark hover:bg-gray-800 transition-colors text-white w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 shadow-lg self-end sm:self-auto group">
                <svg className="w-7 h-7 md:w-10 md:h-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </button>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* SOLUTION SECTION: MEET TL;DR */}
          <section className="bg-dark rounded-[32px] p-8 md:p-12 text-white grid grid-cols-12 gap-8 md:gap-12 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mt-20 -mr-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gray-700/20 rounded-full blur-3xl -mb-20 -ml-20"></div>

            <div className="col-span-12 md:col-span-6 relative z-10 flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                MEET TL;DR
              </h2>
              <div className="space-y-4 text-gray-400 font-medium">
                <p>We built the tool we needed. <strong className="text-white">TL;DR</strong> transforms passive video consumption into an active, structured learning experience.</p>
                <p>Our AI doesn't just transcribe — it understands. It extracts the core concepts, organizes them logically, and tests your mastery.</p>
              </div>

              <div className="mt-8 space-y-3 font-mono text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                  <span className="text-gray-300">Instant Structuring into Modules</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                  <span className="text-gray-300">Active Recall Quizzes per Topic</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                  <span className="text-gray-300">Contextual AI Tutor for Questions</span>
                </div>
              </div>
            </div>

            {/* Visual Terminal/Code Component */}
            <div className="col-span-12 md:col-span-6 relative z-10 hidden md:block">
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-[20px] p-6 font-mono text-[13px] shadow-2xl h-full flex flex-col">
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="space-y-3 text-gray-400 grow">
                  <p><span className="text-primary font-bold">tldr</span> process https://youtu.be/...</p>
                  <p className="text-green-400/90">✔ Fetching transcript...</p>
                  <p className="text-green-400/90">✔ Analyzing content structure...</p>
                  <p className="text-green-400/90">✔ Generating quizzes...</p>
                  <p className="text-blue-400/90">ℹ Course ready: Intro to Neural Networks</p>
                  <p className="mt-6"><span className="text-primary font-bold">user</span> explain backpropagation</p>
                  <p className="text-gray-300">Let's break that down based on the video...</p>
                  <p className="mt-3"><span className="w-2 h-4 inline-block bg-primary animate-pulse"></span></p>
                </div>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section>
            <h2 className="text-center text-4xl md:text-5xl font-black text-dark tracking-tighter uppercase mb-2">
              HOW IT WORKS
            </h2>
            <p className="text-center text-gray-500 font-mono text-xs uppercase tracking-widest mb-10 font-bold">Master Any Skill in 3 Steps</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-[1.5px] border-gray-200 rounded-[24px] p-8 hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col items-start">
                <div className="text-6xl font-black text-gray-100 group-hover:text-primary/20 transition-colors mb-4">01</div>
                <h3 className="font-bold text-dark text-xl mb-3 uppercase tracking-tight">Drop a Link</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed grow">Find that 30 mins tutorial because on free tier :)  you've been putting off. Copy the URL and paste it into TL;DR.</p>
                <div className="inline-block mt-6 text-[10px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-md">Instant Input</div>
              </div>
              <div className="bg-white border-[1.5px] border-gray-200 rounded-[24px] p-8 hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col items-start">
                <div className="text-6xl font-black text-gray-100 group-hover:text-primary/20 transition-colors mb-4">02</div>
                <h3 className="font-bold text-dark text-xl mb-3 uppercase tracking-tight">Generate Course</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed grow">Our AI takes in the video content for you. It synthesizes the transcript into digestible, organized modules.</p>
                <div className="inline-block mt-6 text-[10px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-md">AI Synthesis</div>
              </div>
              <div className="bg-white border-[1.5px] border-gray-200 rounded-[24px] p-8 hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col items-start">
                <div className="text-6xl font-black text-gray-100 group-hover:text-primary/20 transition-colors mb-4">03</div>
                <h3 className="font-bold text-dark text-xl mb-3 uppercase tracking-tight">Verify Mastery</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed grow">Read the takeaways. Take the AI-generated quizzes. Ask the tutor questions. Actually learn it.</p>
                <div className="inline-block mt-6 text-[10px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-md">Active Learning</div>
              </div>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* NARRATIVE SECTION */}
          <section className="max-w-3xl mx-auto text-center py-6">
            <div className="text-8xl font-black text-gray-200 leading-[0.5] mb-6">"</div>
            <p className="text-xl md:text-2xl text-gray-500 font-medium leading-relaxed">
              We've all been there: staring blankly at a screen while a developer codes an entire app in 40 minutes, nodding along, then realizing you <strong className="text-dark font-black">have no idea how to do it yourself.</strong> We built TL;DR to fix this.
            </p>
            <p className="mt-8 font-mono text-xs uppercase tracking-widest font-bold text-gray-400">
              — The TL;DR Team
            </p>
          </section>

          {/* CTA SECTION */}
          <section className="bg-primary/5 border-[1.5px] border-primary/20 rounded-[32px] p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-dark tracking-tighter uppercase mb-6 leading-none">
                Ready? Escape <br />Tutorial Hell. <br />For Good.
              </h2>
              <p className="text-gray-600 font-medium mb-10 text-lg">
                Stop hoarding bookmarks. Start acquiring skills.
              </p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-dark text-white font-black px-10 py-5 rounded-full uppercase tracking-tighter text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto group shadow-xl">
                Transform a Video Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
              </button>
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <footer className="px-10 py-8 border-t border-gray-100 flex justify-end items-end text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50/50">
          <div>© 2026 TL;DR</div>
        </footer>
      </div>
    </div>
  )
}