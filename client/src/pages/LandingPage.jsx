import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import './LandingPage.css'

const FEATURES = [
  { icon: '🎬', title: 'YouTube to Course', desc: 'Paste any YouTube link and watch it transform into a structured course with lessons.' },
  { icon: '🧠', title: 'AI-Powered Summaries', desc: 'Gemini AI reads the transcript and creates clean summaries, key concepts, and explanations.' },
  { icon: '🧩', title: 'Auto-Generated Quizzes', desc: 'Every lesson gets 5 smart MCQ questions with instant feedback and explanations.' },
  { icon: '💬', title: 'AI Tutor Chat', desc: 'Ask anything about the video. Your personal AI tutor answers using course context.' },
]

export default function LandingPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const isValidYouTube = (u) => /youtube\.com\/watch|youtu\.be\//.test(u)

  const handleGenerate = async (e) => {
    e.preventDefault()
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
    <div className="landing">
      <Navbar />

      <section className="hero-section hero-gradient">
        <div className="container hero-content">
          {/* Floating Elements Decor */}
          <div className="floating-decor decor-1 hide-mobile">
            <div className="glass-card decor-card p-4 shadow-2xl">
              <div className="decor-label text-primary font-bold uppercase mb-2">Quiz Active</div>
              <div className="text-sm font-semibold mb-3">What is Quantum Computing?</div>
              <div className="space-y-1">
                <div className="w-full bg-primary-20 h-2 rounded-full"></div>
                <div className="w-2-3 bg-white-10 h-2 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="floating-decor decor-2 hide-mobile">
            <div className="glass-card decor-card p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-pink-500"></div>
                <span className="text-xs font-medium">Smart AI Tutor</span>
              </div>
              <p className="decor-text-small text-gray-300 italic">"Based on the 5:30 mark of the video, the main concept is..."</p>
            </div>
          </div>

          <h1>
            Turn Any YouTube Video Into an <br className="hide-mobile"/>
            <span className="gradient-text">Interactive Course</span>
          </h1>
          <p className="hero-subtitle">
            Stop passive watching. EduAI uses advanced artificial intelligence to transform video content into structured lessons, quizzes, and personalized notes instantly.
          </p>

          <form className="hero-input-group" onSubmit={handleGenerate}>
            <div className="yt-input-wrapper">
              <input
                type="text"
                className="yt-input"
                placeholder="Paste YouTube Video URL here..."
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError('') }}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary generate-btn animate-glow" disabled={loading}>
                {loading ? (
                  <><span className="btn-spinner"></span> Generating...</>
                ) : (
                  'Generate Course'
                )}
              </button>
            </div>
          </form>
          <p className="mt-6 text-sm text-gray-500">Try it for free. No credit card required.</p>
</div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <h2>Everything you need to <span className="gradient-text">learn faster</span></h2>
            <p>From raw video to structured knowledge — completely automated.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card card">
            <h2>Ready to learn smarter?</h2>
            <p>Turn your YouTube watch queue into a real study plan.</p>
            <button className="btn btn-primary btn-lg" onClick={() => document.querySelector('.yt-input')?.focus()}>
              Get Started Free →
            </button>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>© 2025 MiyagiLabs — AI-powered learning</p>
        </div>
      </footer>
    </div>
  )
}
