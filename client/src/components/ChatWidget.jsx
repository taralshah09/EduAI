import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import MarkdownRenderer from './MarkdownRenderer'
import './ChatWidget.css'

export default function ChatWidget({ courseId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadHistory()
  }, [courseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/chat/${courseId}`)
      setMessages(data.messages)
    } catch {
      // empty history is fine
    } finally {
      setLoadingHistory(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text, _id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/chat', {
        courseId,
        message: text,
      })
      const assistantMsg = { role: 'assistant', content: data.answer, _id: Date.now() + 1 }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, something went wrong. Please try again.',
        _id: Date.now() + 1
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-avatar">🤖</span>
          <div>
            <h4>AI Tutor</h4>
            <span className="chat-status">Ask anything about this course</span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {loadingHistory ? (
          <div className="chat-loading">
            <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }}></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty-icon">💬</span>
            <p>Ask anything about the course material!</p>
            <div className="chat-suggestions">
              {['What is the main topic?', 'Explain a key concept', 'Give me an example'].map(s => (
                <button key={s} className="suggestion-chip" onClick={() => setInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id || msg.createdAt} className={`chat-message ${msg.role}`}>
              {msg.role === 'assistant' && <span className="msg-avatar">🤖</span>}
              <div className="msg-bubble">
                <MarkdownRenderer content={msg.content} />
              </div>
              {msg.role === 'user' && <span className="msg-avatar user-avatar">You</span>}
            </div>
          ))
        )}

        {loading && (
          <div className="chat-message assistant">
            <span className="msg-avatar">🤖</span>
            <div className="msg-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={sendMessage}>
        <textarea
          className="chat-input"
          placeholder="Ask your AI tutor..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
