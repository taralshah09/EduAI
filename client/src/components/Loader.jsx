import './Loader.css'

const STEPS = [
  { icon: '🔗', text: 'Fetching video transcript...' },
  { icon: '✂️', text: 'Chunking content into lessons...' },
  { icon: '🧠', text: 'Generating lesson summaries...' },
  { icon: '🧩', text: 'Building quiz questions...' },
  { icon: '✅', text: 'Finalizing your course...' },
]

export default function Loader({ message = 'Processing your YouTube video', step = -1 }) {
  return (
    <div className="loader-wrapper">
      <div className="loader-card card">
        <div className="spinner"></div>
        <h3>{message}</h3>
        <p className="loader-sub">This usually takes 30–60 seconds</p>
        <div className="loader-steps">
          {STEPS.map((s, i) => (
            <div key={i} className={`loader-step ${step >= i ? 'done' : ''} ${step === i ? 'active' : ''}`}>
              <span className="loader-step-icon">{s.icon}</span>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
