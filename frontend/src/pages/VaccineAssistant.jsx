import { useState, useRef, useEffect } from 'react'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const EXAMPLE_QUESTIONS = [
  'What genes are associated with COVID-19 vaccines?',
  'How does the influenza vaccine interact with immune response genes?',
  'What is the relationship between BCG vaccine and TNF?',
  'Which vaccines target the ACE2 pathway?',
]

// HTML-escape raw text before applying markdown transformations
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Simple markdown renderer – escapes input first to prevent XSS
function renderMarkdown(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    const safe = escapeHtml(line)
    const rendered = safe
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
    if (safe.startsWith('## '))
      return <h3 key={i} className="font-semibold text-teal-dark mt-3 mb-1" dangerouslySetInnerHTML={{ __html: rendered.slice(3) }} />
    if (safe.startsWith('- '))
      return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: rendered.slice(2) }} />
    if (safe.trim() === '') return <br key={i} />
    return <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: rendered }} />
  })
}

export default function VaccineAssistant() {
  const [messages, setMessages] = useState([])
  const [conversationHistory, setConversationHistory] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendQuestion(question) {
    if (!question.trim()) return
    setError(null)

    const userMessage = { role: 'user', content: question }
    const newMessages = [...messages, { type: 'user', text: question }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const updatedHistory = [...conversationHistory, { role: 'user', content: question }]

    try {
      const res = await fetch('/api/v1/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          conversation_history: conversationHistory,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const assistantEntry = {
        type: 'assistant',
        text: data.answer ?? data.response ?? JSON.stringify(data),
        cited_pmids: data.cited_pmids ?? [],
        evidence: data.evidence ?? [],
        genes_detected: data.genes_detected ?? [],
      }

      setMessages((prev) => [...prev, assistantEntry])
      setConversationHistory([
        ...updatedHistory,
        { role: 'assistant', content: assistantEntry.text },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: 'assistant', text: `Sorry, I encountered an error: ${err.message}`, cited_pmids: [], evidence: [], genes_detected: [] },
      ])
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!loading) sendQuestion(input)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) sendQuestion(input)
    }
  }

  function startNewChat() {
    setMessages([])
    setConversationHistory([])
    setInput('')
    setError(null)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-dark">Vaccine Literature Assistant</h1>
          <p className="text-gray-500 text-sm mt-1">
            Evidence-grounded Q&amp;A about vaccine-gene interactions from PubMed literature.
          </p>
        </div>
        {hasMessages && (
          <button
            onClick={startNewChat}
            className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            New Chat
          </button>
        )}
      </div>

      {/* Initial state: example questions */}
      {!hasMessages && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Try asking one of these questions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                className="text-left bg-white border border-gray-200 rounded-lg p-3 hover:border-teal-400 hover:shadow-sm transition-all text-sm text-gray-700 hover:text-teal-dark"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {hasMessages && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm min-h-64">
          <div className="px-4 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'user' ? (
                  <div className="max-w-[75%] bg-teal-dark text-white rounded-lg px-4 py-2.5 text-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[85%] space-y-2">
                    {/* Answer bubble */}
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 shadow-sm">
                      <div className="leading-relaxed">{renderMarkdown(msg.text)}</div>

                      {/* Detected genes */}
                      {msg.genes_detected?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="text-xs text-gray-400">Genes:</span>
                          {msg.genes_detected.map((g) => (
                            <span key={g} className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">{g}</span>
                          ))}
                        </div>
                      )}

                      {/* Cited PMIDs */}
                      {msg.cited_pmids?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs text-gray-400">Citations:</span>
                          {msg.cited_pmids.map((pmid) => (
                            <a
                              key={pmid}
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-0.5 rounded transition-colors"
                            >
                              PMID:{pmid}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Evidence expandable */}
                    {msg.evidence?.length > 0 && (
                      <details className="bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        <summary className="px-3 py-2 cursor-pointer text-gray-500 hover:text-gray-700 font-medium select-none">
                          Evidence ({msg.evidence.length} source{msg.evidence.length !== 1 ? 's' : ''})
                        </summary>
                        <div className="px-3 pb-3 space-y-2 pt-1">
                          {msg.evidence.map((ev, j) => (
                            <div key={j} className="bg-white border border-gray-100 rounded p-2 text-gray-600 leading-relaxed">
                              {ev.sentence ?? ev.text ?? JSON.stringify(ev)}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-500">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about vaccine-gene interactions, mechanisms, or literature evidence..."
          rows={2}
          disabled={loading}
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-none disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors self-end"
        >
          Send
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center">
        Answers are grounded in PubMed literature evidence. Always verify with primary sources.
      </p>
    </div>
  )
}
