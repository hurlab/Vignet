import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

function csvSafe(val) {
  let v = String(val ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v
  return `"${v}"`
}

function downloadCsv(rows, headers, filename) {
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => csvSafe(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function VacPair() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Vaccine autocomplete state
  const [vaccineQuery, setVaccineQuery] = useState('')
  const [selectedVaccine, setSelectedVaccine] = useState(null) // { vo_id, name }
  const [vaccineSuggestions, setVaccineSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Gene input state
  const [geneInput, setGeneInput] = useState('')
  const [availableGenes, setAvailableGenes] = useState([]) // top_genes from vaccine profile
  const [geneSuggestions, setGeneSuggestions] = useState([])
  const [showGeneSuggestions, setShowGeneSuggestions] = useState(false)
  const geneSuggestionsRef = useRef(null)

  // Evidence level toggle
  const [level, setLevel] = useState('sentence') // 'sentence' | 'abstract'

  // Results state
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('score') // 'score' | 'pmid'
  const [visibleCount, setVisibleCount] = useState(20)

  // Initialize from URL params
  useEffect(() => {
    const vo = searchParams.get('vo')
    const gene = searchParams.get('gene')
    if (vo) {
      setSelectedVaccine({ vo_id: vo, name: vo })
      setVaccineQuery(vo)
      // Try to resolve name
      api.vaccineProfile(vo)
        .then((data) => {
          if (data?.name) {
            setSelectedVaccine({ vo_id: vo, name: data.name })
            setVaccineQuery(data.name)
          }
        })
        .catch(() => {})
    }
    if (gene) {
      setGeneInput(gene.toUpperCase())
    }
    // Auto-submit if both params present
    if (vo && gene) {
      setLoading(true)
      setError(null)
      api.vaccinePair(vo, gene.toUpperCase())
        .then(setResult)
        .catch((err) => { setError(err.message); setResult(null) })
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
      if (geneSuggestionsRef.current && !geneSuggestionsRef.current.contains(e.target)) {
        setShowGeneSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch top genes when a vaccine is selected
  useEffect(() => {
    if (!selectedVaccine?.vo_id) {
      setAvailableGenes([])
      setGeneSuggestions([])
      return
    }
    api.vaccineProfile(selectedVaccine.vo_id)
      .then((data) => {
        const genes = data?.top_genes ?? []
        setAvailableGenes(genes)
      })
      .catch(() => setAvailableGenes([]))
  }, [selectedVaccine?.vo_id])

  function handleVaccineInput(val) {
    setVaccineQuery(val)
    setSelectedVaccine(null)
    clearTimeout(debounceRef.current)
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await api.vaccineExplore(val.trim(), 8)
          setVaccineSuggestions(data.vaccines || [])
          setShowSuggestions(true)
        } catch {
          setVaccineSuggestions([])
        }
      }, 300)
    } else {
      setVaccineSuggestions([])
      setShowSuggestions(false)
    }
  }

  function handleSelectSuggestion(v) {
    setSelectedVaccine({ vo_id: v.vo_id, name: v.name })
    setVaccineQuery(v.name)
    setShowSuggestions(false)
    setVaccineSuggestions([])
  }

  function handleGeneInput(val) {
    setGeneInput(val.toUpperCase())
    if (availableGenes.length > 0 && val.trim().length >= 1) {
      const query = val.toUpperCase()
      const matches = availableGenes.filter((g) =>
        g.gene.toUpperCase().startsWith(query)
      )
      setGeneSuggestions(matches.slice(0, 10))
      setShowGeneSuggestions(matches.length > 0)
    } else {
      setGeneSuggestions([])
      setShowGeneSuggestions(false)
    }
  }

  function handleSelectGeneSuggestion(geneSymbol) {
    setGeneInput(geneSymbol.toUpperCase())
    setGeneSuggestions([])
    setShowGeneSuggestions(false)
  }

  function handleTryExample() {
    const exampleVo = 'VO_0004908'
    const exampleName = 'COVID-19 vaccine'
    const exampleGene = 'ACE2'
    setSelectedVaccine({ vo_id: exampleVo, name: exampleName })
    setVaccineQuery(exampleName)
    setGeneInput(exampleGene)
    setShowSuggestions(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const voId = selectedVaccine?.vo_id
    const gene = geneInput.trim().toUpperCase()
    if (!voId || !gene) return
    setSearchParams({ vo: voId, gene })
    setLoading(true)
    setError(null)
    setResult(null)
    setVisibleCount(20)
    api.vaccinePair(voId, gene, level)
      .then(setResult)
      .catch((err) => { setError(err.message); setResult(null) })
      .finally(() => setLoading(false))
  }

  // Sort sentences
  const sortedSentences = result?.sentences
    ? [...result.sentences].sort((a, b) => {
        if (sortBy === 'score') return (b.score ?? 0) - (a.score ?? 0)
        return String(a.pmid ?? '').localeCompare(String(b.pmid ?? ''))
      })
    : []

  const visibleSentences = sortedSentences.slice(0, visibleCount)

  function handleExportCsv() {
    if (!result) return
    const headers = ['sentence', 'pmid', 'gene', 'score']
    downloadCsv(
      sortedSentences.map((s) => ({
        sentence: s.sentence ?? '',
        pmid: s.pmid ?? '',
        gene: s.gene ?? result.gene_symbol ?? '',
        score: s.score ?? '',
      })),
      headers,
      `vacpair_${result.vo_id}_${result.gene_symbol}.csv`
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">VacPair</h1>
        <p className="text-gray-500 text-sm mt-1">
          View co-occurrence evidence for a vaccine-gene pair from PubMed literature.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Vaccine autocomplete */}
          <div className="flex-1 relative" ref={suggestionsRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vaccine</label>
            <input
              type="text"
              value={vaccineQuery}
              onChange={(e) => handleVaccineInput(e.target.value)}
              onFocus={() => vaccineSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g., COVID-19 vaccine, BCG..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              autoComplete="off"
            />
            {showSuggestions && vaccineSuggestions.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                {vaccineSuggestions.map((v) => (
                  <li key={v.vo_id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-gray-700"
                      onMouseDown={() => handleSelectSuggestion(v)}
                    >
                      <span className="font-medium text-teal-dark">{v.name}</span>
                      <span className="text-xs text-gray-400 ml-2 font-mono">{v.vo_id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Gene input */}
          <div className="flex-1 relative" ref={geneSuggestionsRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Gene Symbol
              {availableGenes.length > 0 && (
                <span className="text-gray-400 font-normal ml-1">({availableGenes.length} genes for this vaccine)</span>
              )}
            </label>
            <input
              type="text"
              value={geneInput}
              onChange={(e) => handleGeneInput(e.target.value)}
              onFocus={() => geneSuggestions.length > 0 && setShowGeneSuggestions(true)}
              placeholder="e.g., ACE2, TNF, IFNG..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              autoComplete="off"
            />
            {showGeneSuggestions && geneSuggestions.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                {geneSuggestions.map((g) => (
                  <li key={g.gene}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-gray-700 flex items-center justify-between"
                      onMouseDown={() => handleSelectGeneSuggestion(g.gene)}
                    >
                      <span className="font-medium text-teal-dark">{g.gene}</span>
                      <span className="text-xs text-gray-400">{g.pmid_count} PMIDs</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Evidence level toggle */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Evidence level:</span>
          <button
            type="button"
            className={level === 'sentence' ? 'font-semibold text-teal-700' : 'hover:text-teal-600'}
            onClick={() => setLevel('sentence')}
          >
            Sentence
          </button>
          <span>|</span>
          <button
            type="button"
            className={level === 'abstract' ? 'font-semibold text-teal-700' : 'hover:text-teal-600'}
            onClick={() => setLevel('abstract')}
          >
            Abstract
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!selectedVaccine || !geneInput.trim() || loading}
            className="bg-accent hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search Evidence
          </button>
          <button
            type="button"
            onClick={handleTryExample}
            className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm transition-colors"
          >
            Try Example
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
      )}

      {loading && <LoadingSpinner message="Loading pair evidence..." />}

      {result && !loading && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-bold text-teal-dark">
                  {result.vaccine_name || result.vo_id}
                  <span className="text-gray-400 font-normal mx-2">&mdash;</span>
                  <span className="text-teal-600">{result.gene_symbol}</span>
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{result.vo_id}</p>
              </div>
              <button
                onClick={handleExportCsv}
                className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm transition-colors flex-shrink-0"
              >
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-teal-50 rounded p-3 text-center">
                <div className="text-xl font-bold text-teal-dark">{result.cooccurrence_count?.toLocaleString() ?? 0}</div>
                <div className="text-xs text-gray-500">Co-occurrences</div>
              </div>
              <div className="bg-blue-50 rounded p-3 text-center">
                <div className="text-xl font-bold text-blue-700">{result.shared_pmids?.toLocaleString() ?? 0}</div>
                <div className="text-xs text-gray-500">Shared PMIDs</div>
              </div>
              <div className="bg-amber-50 rounded p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{result.total_sentences?.toLocaleString() ?? 0}</div>
                <div className="text-xs text-gray-500">Total Sentences</div>
              </div>
            </div>
          </div>

          {/* Evidence table */}
          {result.sentences?.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">
                    {level === 'sentence' ? 'Evidence Sentences' : 'Evidence by Abstract (PMID)'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {level === 'sentence'
                      ? `Showing ${visibleSentences.length} of ${sortedSentences.length} sentences`
                      : `${[...new Set(sortedSentences.map((s) => s.pmid).filter(Boolean))].length} unique abstracts`
                    }
                  </p>
                </div>
                {level === 'sentence' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Sort by:</span>
                    <button
                      onClick={() => setSortBy('score')}
                      className={`text-xs px-2 py-1 rounded transition-colors ${sortBy === 'score' ? 'bg-teal-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      Score
                    </button>
                    <button
                      onClick={() => setSortBy('pmid')}
                      className={`text-xs px-2 py-1 rounded transition-colors ${sortBy === 'pmid' ? 'bg-teal-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      PMID
                    </button>
                  </div>
                )}
              </div>

              {level === 'sentence' ? (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Sentence</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs w-24">PMID</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs w-20">Gene</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs w-16">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleSentences.map((s, i) => (
                        <tr key={i} className="hover:bg-teal-50/20">
                          <td className="px-4 py-2.5 text-gray-700 leading-relaxed">{s.sentence}</td>
                          <td className="px-4 py-2.5">
                            {s.pmid ? (
                              <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${s.pmid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline text-xs font-mono"
                              >
                                {s.pmid}
                              </a>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-teal-700 font-medium text-xs">{s.gene ?? result.gene_symbol}</td>
                          <td className="px-4 py-2.5 text-right text-gray-600 text-xs font-mono">
                            {s.score != null ? s.score.toFixed(3) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleCount < sortedSentences.length && (
                    <div className="px-4 py-3 border-t border-gray-100 text-center">
                      <button
                        onClick={() => setVisibleCount((n) => n + 20)}
                        className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm transition-colors"
                      >
                        Load more ({sortedSentences.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Abstract level: group sentences by PMID
                <div className="divide-y divide-gray-100">
                  {Object.entries(
                    sortedSentences.reduce((acc, s) => {
                      const pmid = s.pmid ?? 'unknown'
                      if (!acc[pmid]) acc[pmid] = []
                      acc[pmid].push(s)
                      return acc
                    }, {})
                  ).map(([pmid, sentences]) => (
                    <div key={pmid} className="px-4 py-3 hover:bg-teal-50/20">
                      <div className="flex items-center justify-between mb-1.5">
                        {pmid !== 'unknown' ? (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline text-xs font-mono font-semibold"
                          >
                            PMID: {pmid}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs font-mono">PMID: —</span>
                        )}
                        <span className="text-xs text-gray-400">{sentences.length} sentence{sentences.length !== 1 ? 's' : ''}</span>
                      </div>
                      <ul className="space-y-1">
                        {sentences.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600 leading-relaxed pl-2 border-l-2 border-teal-100">
                            {s.sentence}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
              No sentence evidence found for this vaccine-gene pair.
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>Select a vaccine and enter a gene symbol to view co-occurrence evidence.</p>
          <p className="mt-1 text-xs">
            Or <Link to="/explore" className="text-teal-600 hover:underline">browse vaccines</Link> to find a vaccine to explore.
          </p>
        </div>
      )}
    </div>
  )
}
