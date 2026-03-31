import { useState } from 'react'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const SAMPLE_TEXT =
  'The mRNA COVID-19 vaccine BNT162b2 developed by Pfizer induces robust expression of ACE2 and TMPRSS2 ' +
  'in respiratory epithelial cells. Studies show that IFNG and TNF are significantly upregulated following ' +
  'vaccination, while IL6 levels correlate with adverse effects including fever and myalgia. The spike ' +
  'protein interacts with CD4 and CD8A T-cell receptors to promote adaptive immunity. Adjuvant formulations ' +
  'containing aluminum hydroxide enhance the BCG vaccine response through NLRP3 inflammasome activation and ' +
  'IL1B release. Comparative studies of influenza vaccine and hepatitis B vaccine show shared upregulation ' +
  'of STAT1 and IRF7 in the innate immune response pathway.'

// Words to exclude from gene detection
const GENE_EXCLUSIONS = new Set([
  'DNA', 'RNA', 'ATP', 'GTP', 'HIV', 'PCR', 'USA', 'THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE',
  'WAS', 'HAS', 'HAD', 'WHO', 'ALL', 'MHC', 'HLA', 'BMI', 'ICU', 'FDA', 'CDC', 'NIH',
  'COVID', 'SARS', 'MRNA', 'ACE', 'BCG', 'MMR', 'DTP', 'HPV',
])

// Vaccine-related terms for highlighting (frontend-only, not sent to BioBERT)
const VACCINE_TERMS = new Set([
  'vaccine', 'vaccination', 'immunization', 'BCG', 'BNT162b2', 'mRNA-1273',
  'ChAdOx1', 'Ad26.COV2.S', 'Sputnik', 'Sinovac', 'Pfizer', 'Moderna',
  'AstraZeneca', 'Covaxin', 'Novavax', 'adjuvant', 'antigen', 'booster',
  'influenza vaccine', 'COVID-19 vaccine', 'hepatitis B vaccine',
  'MMR vaccine', 'HPV vaccine', 'pneumococcal vaccine',
])

function detectVaccineTerms(text) {
  const found = new Set()
  // Check multi-word terms first (longest match)
  const sortedTerms = [...VACCINE_TERMS].sort((a, b) => b.length - a.length)
  for (const term of sortedTerms) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(text)) found.add(term)
  }
  return [...found]
}

function detectGenes(text) {
  const matches = text.match(/\b([A-Z][A-Z0-9]{1,9})\b/g) ?? []
  const seen = new Set()
  return matches
    .filter((m) => !GENE_EXCLUSIONS.has(m))
    .filter((m) => {
      if (seen.has(m)) return false
      seen.add(m)
      return true
    })
}

function tokenizeSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
}

function getConfidenceClass(score) {
  if (score >= 0.8) return 'text-green-700 font-semibold'
  if (score >= 0.5) return 'text-yellow-700'
  return 'text-gray-500'
}

function getConfidenceBg(score) {
  if (score >= 0.8) return 'bg-green-50'
  if (score >= 0.5) return 'bg-yellow-50'
  return 'bg-gray-50'
}

export default function AnalyzeText() {
  // Step 1: text input
  const [text, setText] = useState('')
  const [step, setStep] = useState(1) // 1, 2, 3

  // Step 2: gene chips
  const [detectedGenes, setDetectedGenes] = useState([]) // { symbol, confirmed }
  const [detectedVaccineTerms, setDetectedVaccineTerms] = useState([])
  const [geneError, setGeneError] = useState(null)

  // Step 3: predictions
  const [predictions, setPredictions] = useState([])
  const [predLoading, setPredLoading] = useState(false)
  const [predError, setPredError] = useState(null)

  // Optional summary
  const [summary, setSummary] = useState(null)
  const [sumLoading, setSumLoading] = useState(false)

  function loadSampleText() {
    setText(SAMPLE_TEXT)
  }

  function handleDetectGenes() {
    if (!text.trim()) {
      setGeneError('Please enter some biomedical text first.')
      return
    }
    const genes = detectGenes(text)
    if (genes.length === 0) {
      setGeneError('No gene symbols detected. Try pasting text containing gene symbols like ACE2, TNF, IL6.')
      return
    }
    setGeneError(null)
    setDetectedGenes(genes.map((g) => ({ symbol: g, confirmed: true })))
    setDetectedVaccineTerms(detectVaccineTerms(text))
    setPredictions([])
    setSummary(null)
    setStep(2)
  }

  function toggleGene(symbol) {
    setDetectedGenes((prev) =>
      prev.map((g) => g.symbol === symbol ? { ...g, confirmed: !g.confirmed } : g)
    )
  }

  function removeGene(symbol) {
    setDetectedGenes((prev) => prev.filter((g) => g.symbol !== symbol))
  }

  const confirmedGenes = detectedGenes.filter((g) => g.confirmed).map((g) => g.symbol)

  async function handleAnalyzeInteractions() {
    if (confirmedGenes.length < 2) return
    setPredLoading(true)
    setPredError(null)
    setPredictions([])

    const sentences = tokenizeSentences(text)

    // Build items: for each sentence, find all confirmed gene pairs
    const items = []
    let idCounter = 0
    for (const sentence of sentences) {
      const genesInSentence = confirmedGenes.filter((g) =>
        new RegExp(`\\b${g}\\b`).test(sentence)
      )
      for (let i = 0; i < genesInSentence.length; i++) {
        for (let j = i + 1; j < genesInSentence.length; j++) {
          items.push({
            Sentence: sentence,
            ID: String(idCounter++),
            MatchTerm: `${genesInSentence[i]}:${genesInSentence[j]}`,
            Gene1: genesInSentence[i],
            Gene2: genesInSentence[j],
          })
        }
      }
    }

    if (items.length === 0) {
      setPredError('No gene pairs found co-occurring in the same sentence. Try adding more text.')
      setPredLoading(false)
      return
    }

    try {
      const res = await fetch('/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPredictions(Array.isArray(data) ? data : data.predictions ?? [])
      setStep(3)
    } catch (err) {
      setPredError(err.message)
    } finally {
      setPredLoading(false)
    }
  }

  async function handleSummarize() {
    setSumLoading(true)
    setSummary(null)
    try {
      const res = await fetch('/api/v1/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_sentences: text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSummary(data.summary ?? data.text ?? JSON.stringify(data))
    } catch (err) {
      setSummary(`Error: ${err.message}`)
    } finally {
      setSumLoading(false)
    }
  }

  function resetAll() {
    setText('')
    setStep(1)
    setDetectedGenes([])
    setDetectedVaccineTerms([])
    setPredictions([])
    setSummary(null)
    setGeneError(null)
    setPredError(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-dark">Analyze Text</h1>
          <p className="text-gray-500 text-sm mt-1">
            Paste biomedical text to detect gene mentions and predict vaccine-gene interactions.
          </p>
        </div>
        {step > 1 && (
          <button
            onClick={resetAll}
            className="border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold px-3 py-1.5 rounded text-sm transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { n: 1, label: 'Input Text' },
          { n: 2, label: 'Confirm Genes' },
          { n: 3, label: 'Results' },
        ].map(({ n, label }, i) => (
          <span key={n} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">/</span>}
            <span className={`font-semibold ${step === n ? 'text-teal-dark' : step > n ? 'text-teal-400' : 'text-gray-400'}`}>
              {n}. {label}
            </span>
          </span>
        ))}
      </div>

      {/* Step 1: Text input */}
      {step >= 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-sm">Step 1: Paste Biomedical Text</h2>
            <button
              onClick={loadSampleText}
              className="text-xs border border-teal-300 text-teal-700 hover:bg-teal-50 px-3 py-1 rounded-full transition-colors"
            >
              Try Sample Text
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (step > 1) { setStep(1); setDetectedGenes([]); setPredictions([]) } }}
            placeholder="Paste biomedical text here (abstracts, sentences, paragraphs)..."
            rows={8}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-y font-mono leading-relaxed"
          />
          {geneError && (
            <p className="text-red-600 text-xs">{geneError}</p>
          )}
          <button
            onClick={handleDetectGenes}
            disabled={!text.trim()}
            className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            Detect Genes
          </button>
        </div>
      )}

      {/* Step 2: Gene chips */}
      {step >= 2 && detectedGenes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div>
            <h2 className="font-semibold text-gray-700 text-sm">Step 2: Confirm Detected Genes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Click to toggle, &times; to remove. Need at least 2 confirmed genes to analyze.
            </p>
            {detectedVaccineTerms.length > 0 && (
              <div className="text-xs text-teal-600 mt-1">
                Also detected: {detectedVaccineTerms.length} vaccine-related term{detectedVaccineTerms.length !== 1 ? 's' : ''} (highlighted below)
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedGenes.map((g) => (
              <span
                key={g.symbol}
                className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full cursor-pointer transition-colors select-none ${
                  g.confirmed
                    ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <span onClick={() => toggleGene(g.symbol)}>{g.symbol}</span>
                <button
                  onClick={() => removeGene(g.symbol)}
                  className="ml-0.5 hover:opacity-70 font-bold leading-none text-xs"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          {detectedVaccineTerms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 self-center">Vaccine terms (info only):</span>
              {detectedVaccineTerms.map((term) => (
                <span
                  key={term}
                  className="inline-flex items-center text-xs px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 select-none"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyzeInteractions}
              disabled={confirmedGenes.length < 2 || predLoading}
              className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
            >
              {predLoading ? 'Analyzing...' : 'Analyze Interactions'}
            </button>
            {confirmedGenes.length < 2 && (
              <span className="text-xs text-gray-400">Select at least 2 genes</span>
            )}
          </div>
          {predError && (
            <p className="text-red-600 text-xs">{predError}</p>
          )}
        </div>
      )}

      {predLoading && <LoadingSpinner message="Running interaction predictions..." />}

      {/* Step 3: Results */}
      {step >= 3 && predictions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-700 text-sm">Step 3: Interaction Predictions</h2>
              <p className="text-xs text-gray-400 mt-0.5">{predictions.length} gene pair{predictions.length !== 1 ? 's' : ''} analyzed</p>
            </div>
            <button
              onClick={handleSummarize}
              disabled={sumLoading}
              className="text-xs border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {sumLoading ? 'Summarizing...' : 'AI Summary'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Gene 1</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Gene 2</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs w-1/2">Sentence</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Prediction</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, i) => {
                  const score = pred.ConfidenceScore ?? 0
                  const label = pred.Label === 1 || pred.Label === '1' ? 'Interaction' : 'No interaction'
                  const isInteraction = label === 'Interaction'
                  return (
                    <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${getConfidenceBg(score)}`}>
                      <td className="px-4 py-2 font-medium text-blue-700">{pred.Gene1}</td>
                      <td className="px-4 py-2 font-medium text-amber-700">{pred.Gene2}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs leading-relaxed max-w-xs">{pred.Sentence}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          isInteraction ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {label}
                        </span>
                      </td>
                      <td className={`px-4 py-2 text-right text-xs ${getConfidenceClass(score)}`}>
                        {(score * 100).toFixed(0)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-teal-dark text-sm mb-2">AI Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  )
}
