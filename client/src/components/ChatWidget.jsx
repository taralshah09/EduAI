import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import MarkdownRenderer from './MarkdownRenderer'

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
      const newMsgs = [
        { role: 'assistant', content: data.answer, _id: Date.now() + 1 }
      ];
      if (data.warning) {
        newMsgs.push({ role: 'assistant', content: data.warning, _id: Date.now() + 2 });
      }
      setMessages(prev => [...prev, ...newMsgs])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.error ? `❌ Error: ${err.response.data.error}` : '❌ Sorry, something went wrong. Please try again.',
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
    <div className="flex flex-col h-full bg-[#18181b] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d9f99d] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#18181b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <div>
            <h2 className="font-display font-extrabold text-white text-lg uppercase tracking-tight">AI Study Buddy</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-[#d9f99d] animate-spin mb-4"></div>
            <p className="text-xs text-white uppercase font-bold tracking-widest">Loading History...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-2xl text-primary">💬</span>
            </div>
            <div>
              <p className="text-white font-bold opacity-80">Ask anything about the course!</p>
              <p className="text-xs text-zinc-500 mt-1">I'm trained on your current lesson material.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg._id || i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${
                msg.role === 'user' ? 'bg-[#d9f99d]' : 'bg-white/10'
              }`}>
                {msg.role === 'user' ? (
                  <span className="text-[10px] font-black text-[#18181b]">YOU</span>
                ) : (
                  <span className="text-[10px] font-black text-[#d9f99d] italic">AI</span>
                )}
              </div>
              <div className={`p-4 rounded-2xl max-w-[85%] border shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#d9f99d] text-[#18181b] border-[#d9f99d] rounded-tr-none font-bold' 
                  : 'bg-white/5 text-zinc-300 border-white/10 rounded-tl-none'
              }`}>
                <div className="text-sm leading-relaxed overflow-hidden prose prose-invert prose-p:my-0 prose-pre:bg-black/40">
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <span className="text-[10px] font-black text-[#d9f99d] italic">AI</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#d9f99d] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#d9f99d] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-[#d9f99d] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-[#18181b] border-t border-white/10 shrink-0">
        <form className="relative" onSubmit={sendMessage}>
          <input
            className="w-full bg-white/10 border-0 rounded-2xl px-6 py-4 pr-16 text-white text-sm placeholder:text-zinc-500 focus:ring-2 focus:ring-[#d9f99d] focus:bg-white/15 transition-all outline-none"
            placeholder="Ask anything about the lesson..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-[#d9f99d] text-[#18181b] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
          </button>
        </form>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </button>
          </div>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest pointer-events-none">Powered by TL;DR</span>
        </div>
      </div>
    </div>
  )
}
