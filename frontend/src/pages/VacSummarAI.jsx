import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const VACCINE_EXAMPLES = [
  {
    label: 'COVID-19 Immune Response',
    genes: ['ACE2', 'TMPRSS2', 'IL6'],
  },
  {
    label: 'Vaccine Adjuvants',
    genes: ['TNF', 'IL1B', 'NLRP3'],
  },
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

export default function VacSummarAI() {
  // Mode: 'vaccine' | 'gene'
  const [mode, setMode] = useState('vaccine')

  // Vaccine autocomplete state
  const [vaccineQuery, setVaccineQuery] = useState('')
  const [vaccineSuggestions, setVaccineSuggestions] = useState([])
  const [vaccineSearching, setVaccineSearching] = useState(false)
  const [selectedVaccines, setSelectedVaccines] = useState([])

  // Gene input state
  const [geneInput, setGeneInput] = useState('')
  const [selectedGenes, setSelectedGenes] = useState([])

  // Summarize state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)
  const [entities, setEntities] = useState(null)

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef(null)

  // Autocomplete search for vaccines
  useEffect(() => {
    if (mode !== 'vaccine' || vaccineQuery.trim().length < 2) {
      setVaccineSuggestions([])
      return
    }
    setVaccineSearching(true)
    const timer = setTimeout(() => {
      api.vaccineExplore(vaccineQuery, 8, 0)
        .then((data) => setVaccineSuggestions(data.vaccines ?? []))
        .catch(() => setVaccineSuggestions([]))
        .finally(() => setVaccineSearching(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [vaccineQuery, mode])

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  function addVaccine(vaccine) {
    if (!selectedVaccines.find((v) => v.vo_id === vaccine.vo_id)) {
      setSelectedVaccines((prev) => [...prev, vaccine])
    }
    setVaccineQuery('')
    setVaccineSuggestions([])
  }

  function removeVaccine(voId) {
    setSelectedVaccines((prev) => prev.filter((v) => v.vo_id !== voId))
  }

  function addGeneFromInput() {
    const symbols = geneInput.toUpperCase().split(/[\s,;]+/).filter(Boolean)
    const toAdd = symbols.filter((s) => !selectedGenes.includes(s))
    if (toAdd.length > 0) setSelectedGenes((prev) => [...prev, ...toAdd])
    setGeneInput('')
  }

  function removeGene(gene) {
    setSelectedGenes((prev) => prev.filter((g) => g !== gene))
  }

  function loadExample(example) {
    setMode('gene')
    setSelectedGenes(example.genes)
    setSelectedVaccines([])
    setSummary(null)
    setEntities(null)
    setChatMessages([])
  }

  function getGeneList() {
    if (mode === 'gene') return selectedGenes
    // Extract gene symbols from selected vaccine names (just use vaccine label for context)
    return selectedGenes
  }

  async function handleSummarize() {
    const genes = getGeneList()
    if (genes.length === 0) {
      setError('Please add at least one gene symbol.')
      return
    }
    setLoading(true)
    setError(null)
    setSummary(null)
    setEntities(null)
    setChatMessages([])

    try {
      const result = await fetch('/api/v1/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genes }),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })

      // Extract summary text from nested response
      const summaryText = result?.Summary?.reply
        ?? result?.summary?.reply
        ?? result?.summary
        ?? result?.text
        ?? (typeof result === 'string' ? result : '')
      setSummary(summaryText || 'No summary generated.')

      // Extract entities from correct path
      const ents = result?.entities ?? {}
      setEntities({
        genes: ents.genes ?? [],
        drugs: ents.drugs ?? [],
        diseases: ents.diseases ?? [],
      })

      // Store conversation history for chat follow-up
      if (result?.Summary?.conversation_history) {
        setChatMessages([])  // Reset chat for new summary
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleChat() {
    const prompt = chatInput.trim()
    if (!prompt) return
    setChatInput('')

    const userMsg = { role: 'user', content: prompt }
    const updatedHistory = [...chatMessages, userMsg]
    setChatMessages(updatedHistory)
    setChatLoading(true)

    try {
      const result = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_history: updatedHistory,
          prompt,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      const replyText = result?.Summary?.reply
        ?? result?.response
        ?? result?.message
        ?? (typeof result === 'string' ? result : JSON.stringify(result))
      const assistantMsg = { role: 'assistant', content: replyText }
      // Update chat history from response if available, otherwise append locally
      if (result?.Summary?.conversation_history) {
        setChatMessages(result.Summary.conversation_history)
      } else {
        setChatMessages((prev) => [...prev, assistantMsg])
      }
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  function handleChatKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChat()
    }
  }

  const allGenes = mode === 'gene' ? selectedGenes : selectedGenes

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">VacSummarAI</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered summarization of vaccine-gene literature from PubMed.
        </p>
      </div>

      {/* Example sets */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium">Examples:</span>
        {VACCINE_EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => loadExample(ex)}
            className="text-xs border border-teal-300 text-teal-700 hover:bg-teal-50 px-3 py-1 rounded-full transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => setMode('vaccine')}
            className={`text-sm font-semibold px-4 py-1.5 rounded transition-colors ${
              mode === 'vaccine'
                ? 'bg-teal-dark text-white'
                : 'border border-teal-600 text-teal-700 hover:bg-teal-50'
            }`}
          >
            Select by Vaccine
          </button>
          <button
            onClick={() => setMode('gene')}
            className={`text-sm font-semibold px-4 py-1.5 rounded transition-colors ${
              mode === 'gene'
                ? 'bg-teal-dark text-white'
                : 'border border-teal-600 text-teal-700 hover:bg-teal-50'
            }`}
          >
            Select by Gene
          </button>
        </div>

        {/* Vaccine mode */}
        {mode === 'vaccine' && (
          <div className="space-y-2 relative">
            <label className="text-xs font-medium text-gray-600">Search vaccine name</label>
            <input
              type="text"
              value={vaccineQuery}
              onChange={(e) => setVaccineQuery(e.target.value)}
              placeholder="e.g. COVID-19, influenza, BCG..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
            />
            {vaccineSearching && (
              <p className="text-xs text-gray-400 pl-1">Searching...</p>
            )}
            {vaccineSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                {vaccineSuggestions.map((v) => (
                  <li
                    key={v.vo_id}
                    onClick={() => addVaccine(v)}
                    className="px-3 py-2 text-sm hover:bg-teal-50 cursor-pointer"
                  >
                    <span className="font-medium text-teal-dark capitalize">{v.name}</span>
                    <span className="text-gray-400 text-xs ml-2 font-mono">{v.vo_id}</span>
                  </li>
                ))}
              </ul>
            )}
            {/* Selected vaccines */}
            {selectedVaccines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedVaccines.map((v) => (
                  <span
                    key={v.vo_id}
                    className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full"
                  >
                    {v.name}
                    <button onClick={() => removeVaccine(v.vo_id)} className="hover:text-teal-600 font-bold leading-none">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gene mode */}
        {mode === 'gene' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-600">Type gene symbols (comma or space separated)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={geneInput}
                onChange={(e) => setGeneInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGeneFromInput()}
                placeholder="e.g. ACE2, TMPRSS2, IL6"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={addGeneFromInput}
                className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm"
              >
                Add
              </button>
            </div>
            {selectedGenes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedGenes.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full"
                  >
                    {g}
                    <button onClick={() => removeGene(g)} className="hover:text-blue-600 font-bold leading-none">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSummarize}
          disabled={loading || allGenes.length === 0}
          className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          {loading ? 'Generating...' : 'Summarize Literature'}
        </button>
        {loading && (
          <p className="text-xs text-gray-400 italic">AI summary generation may take 10-30 seconds</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
      )}

      {loading && <LoadingSpinner message="Generating AI summary..." />}

      {/* Summary result */}
      {summary && !loading && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h2 className="font-semibold text-teal-dark text-base mb-3">AI Summary</h2>
            <div className="text-sm text-gray-700 leading-relaxed">
              {renderMarkdown(summary)}
            </div>
          </div>

          {/* Entity tags */}
          {entities && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm">Detected Entities</h3>
              {entities.genes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Genes:</span>
                  {entities.genes.map((e, i) => (
                    <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                      {e.term} ({e.count})
                    </span>
                  ))}
                </div>
              )}
              {entities.drugs?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Drugs:</span>
                  {entities.drugs.map((e, i) => (
                    <span key={i} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                      {e.term} ({e.count})
                    </span>
                  ))}
                </div>
              )}
              {entities.diseases?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">Diseases:</span>
                  {entities.diseases.map((e, i) => (
                    <span key={i} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                      {e.term} ({e.count})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat follow-up */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">Follow-up Questions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Ask follow-up questions about the summary</p>
            </div>

            {/* Message history */}
            <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
              {chatMessages.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Ask a follow-up question below</p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-teal-dark text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? <div className="leading-relaxed">{renderMarkdown(msg.content)}</div>
                      : msg.content
                    }
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 italic">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Ask a follow-up question..."
                disabled={chatLoading}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500 disabled:bg-gray-50"
              />
              <button
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
