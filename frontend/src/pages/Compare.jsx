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

// Reusable vaccine autocomplete input
function VaccineAutocomplete({ label, value, selectedVaccine, onInput, onSelect, suggestions, showSuggestions, onFocus, containerRef }) {
  return (
    <div className="flex-1 relative" ref={containerRef}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onInput(e.target.value)}
        onFocus={onFocus}
        placeholder="e.g., COVID-19 vaccine, Influenza..."
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        autoComplete="off"
      />
      {selectedVaccine && (
        <p className="text-xs text-teal-600 font-mono mt-0.5">{selectedVaccine.vo_id}</p>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((v) => (
            <li key={v.vo_id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-gray-700"
                onMouseDown={() => onSelect(v)}
              >
                <span className="font-medium text-teal-dark">{v.name}</span>
                <span className="text-xs text-gray-400 ml-2 font-mono">{v.vo_id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SummaryCard({ profile, label, colorClass }) {
  if (!profile) return null
  return (
    <div className={`bg-white border-2 ${colorClass} rounded-lg p-4 flex-1`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
      <h3 className="font-bold text-teal-dark text-base leading-tight capitalize">{profile.name}</h3>
      <p className="text-xs text-gray-400 font-mono mt-0.5">{profile.vo_id}</p>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="font-bold text-teal-dark text-sm">{profile.total_mentions?.toLocaleString() ?? 0}</div>
          <div className="text-xs text-gray-400">Mentions</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="font-bold text-teal-dark text-sm">{profile.pmid_count?.toLocaleString() ?? 0}</div>
          <div className="text-xs text-gray-400">PMIDs</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="font-bold text-teal-dark text-sm">{profile.top_genes?.length ?? 0}</div>
          <div className="text-xs text-gray-400">Genes</div>
        </div>
        <div className="bg-gray-50 rounded p-2 text-center">
          <div className="font-bold text-teal-dark text-sm">{profile.top_drugs?.length ?? 0}</div>
          <div className="text-xs text-gray-400">Drugs</div>
        </div>
      </div>
    </div>
  )
}

function VennDiagram({ countA, countShared, countB, nameA, nameB }) {
  const total = countA + countShared + countB
  if (total === 0) return null
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center relative" style={{ height: 120, width: 280 }}>
        {/* Circle A */}
        <div
          className="absolute rounded-full bg-teal-200/60 border-2 border-teal-400 flex items-center justify-center"
          style={{ width: 120, height: 120, left: 20, top: 0 }}
        />
        {/* Circle B */}
        <div
          className="absolute rounded-full bg-amber-200/60 border-2 border-amber-400 flex items-center justify-center"
          style={{ width: 120, height: 120, left: 140, top: 0 }}
        />
        {/* Labels */}
        <span className="absolute text-xs font-bold text-teal-700" style={{ left: 34, top: 46 }}>{countA}</span>
        <span className="absolute text-xs font-bold text-gray-600" style={{ left: 126, top: 46 }}>{countShared}</span>
        <span className="absolute text-xs font-bold text-amber-700" style={{ left: 216, top: 46 }}>{countB}</span>
      </div>
      <div className="flex items-center gap-8 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
          <span className="text-gray-600 truncate max-w-[100px]" title={nameA}>{nameA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span className="text-gray-600 truncate max-w-[100px]" title={nameB}>{nameB}</span>
        </span>
      </div>
    </div>
  )
}

function GeneColumn({ title, genes, colorClass, textClass }) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-xs font-semibold uppercase tracking-wide px-3 py-2 ${colorClass} rounded-t`}>
        <span className={textClass}>{title}</span>
        <span className="ml-1 text-gray-400">({genes.length})</span>
      </div>
      <div className="border border-t-0 border-gray-200 rounded-b max-h-64 overflow-y-auto">
        {genes.length === 0 ? (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">None</div>
        ) : (
          genes.map((g) => (
            <div key={g} className="px-3 py-1.5 text-xs text-gray-700 border-b border-gray-50 last:border-0 hover:bg-gray-50">
              {g}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Vaccine A state
  const [queryA, setQueryA] = useState('')
  const [selectedA, setSelectedA] = useState(null)
  const [suggestionsA, setSuggestionsA] = useState([])
  const [showA, setShowA] = useState(false)
  const debounceA = useRef(null)
  const refA = useRef(null)

  // Vaccine B state
  const [queryB, setQueryB] = useState('')
  const [selectedB, setSelectedB] = useState(null)
  const [suggestionsB, setSuggestionsB] = useState([])
  const [showB, setShowB] = useState(false)
  const debounceB = useRef(null)
  const refB = useRef(null)

  // Results
  const [profileA, setProfileA] = useState(null)
  const [profileB, setProfileB] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialize from URL params
  useEffect(() => {
    const vo1 = searchParams.get('vo1')
    const vo2 = searchParams.get('vo2')
    const promises = []
    if (vo1) {
      setSelectedA({ vo_id: vo1, name: vo1 })
      setQueryA(vo1)
      promises.push(
        api.vaccineProfile(vo1).then((d) => {
          if (d?.name) {
            setSelectedA({ vo_id: vo1, name: d.name })
            setQueryA(d.name)
          }
        }).catch(() => {})
      )
    }
    if (vo2) {
      setSelectedB({ vo_id: vo2, name: vo2 })
      setQueryB(vo2)
      promises.push(
        api.vaccineProfile(vo2).then((d) => {
          if (d?.name) {
            setSelectedB({ vo_id: vo2, name: d.name })
            setQueryB(d.name)
          }
        }).catch(() => {})
      )
    }
    if (vo1 && vo2) {
      setLoading(true)
      setError(null)
      Promise.all([api.vaccineProfile(vo1), api.vaccineProfile(vo2)])
        .then(([a, b]) => { setProfileA(a); setProfileB(b) })
        .catch((err) => { setError(err.message); setProfileA(null); setProfileB(null) })
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (refA.current && !refA.current.contains(e.target)) setShowA(false)
      if (refB.current && !refB.current.contains(e.target)) setShowB(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function makeInputHandler(setter, setSuggestions, setShow, debounceRef, setSelected) {
    return function handleInput(val) {
      setter(val)
      setSelected(null)
      clearTimeout(debounceRef.current)
      if (val.trim().length >= 2) {
        debounceRef.current = setTimeout(async () => {
          try {
            const data = await api.vaccineExplore(val.trim(), 8)
            setSuggestions(data.vaccines || [])
            setShow(true)
          } catch {
            setSuggestions([])
          }
        }, 300)
      } else {
        setSuggestions([])
        setShow(false)
      }
    }
  }

  const handleInputA = makeInputHandler(setQueryA, setSuggestionsA, setShowA, debounceA, setSelectedA)
  const handleInputB = makeInputHandler(setQueryB, setSuggestionsB, setShowB, debounceB, setSelectedB)

  function handleSelectA(v) {
    setSelectedA({ vo_id: v.vo_id, name: v.name })
    setQueryA(v.name)
    setShowA(false)
    setSuggestionsA([])
  }

  function handleSelectB(v) {
    setSelectedB({ vo_id: v.vo_id, name: v.name })
    setQueryB(v.name)
    setShowB(false)
    setSuggestionsB([])
  }

  function handleTryExample() {
    const exA = { vo_id: 'VO_0004908', name: 'COVID-19 vaccine' }
    const exB = { vo_id: 'VO_0000642', name: 'influenza virus vaccine' }
    setSelectedA(exA); setQueryA(exA.name); setShowA(false)
    setSelectedB(exB); setQueryB(exB.name); setShowB(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!selectedA || !selectedB) return
    setSearchParams({ vo1: selectedA.vo_id, vo2: selectedB.vo_id })
    setLoading(true)
    setError(null)
    setProfileA(null)
    setProfileB(null)
    Promise.all([api.vaccineProfile(selectedA.vo_id), api.vaccineProfile(selectedB.vo_id)])
      .then(([a, b]) => { setProfileA(a); setProfileB(b) })
      .catch((err) => { setError(err.message); setProfileA(null); setProfileB(null) })
      .finally(() => setLoading(false))
  }

  // Compute gene sets client-side
  const genesA = new Set((profileA?.top_genes ?? []).map((g) => g.gene).filter(Boolean))
  const genesB = new Set((profileB?.top_genes ?? []).map((g) => g.gene).filter(Boolean))
  const shared = [...genesA].filter((g) => genesB.has(g)).sort()
  const uniqueA = [...genesA].filter((g) => !genesB.has(g)).sort()
  const uniqueB = [...genesB].filter((g) => !genesA.has(g)).sort()

  function handleExportCsv() {
    if (!profileA || !profileB) return
    const maxLen = Math.max(uniqueA.length, shared.length, uniqueB.length)
    const rows = Array.from({ length: maxLen }, (_, i) => ({
      [`unique_${profileA.name}`]: uniqueA[i] ?? '',
      shared: shared[i] ?? '',
      [`unique_${profileB.name}`]: uniqueB[i] ?? '',
    }))
    const headers = [`unique_${profileA.name}`, 'shared', `unique_${profileB.name}`]
    downloadCsv(rows, headers, `compare_${profileA.vo_id}_${profileB.vo_id}.csv`)
  }

  const hasResults = profileA && profileB && !loading

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Compare Vaccines</h1>
        <p className="text-gray-500 text-sm mt-1">
          Compare two vaccines side by side: shared genes, unique pathways, and literature statistics.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <VaccineAutocomplete
            label="Vaccine A"
            value={queryA}
            selectedVaccine={selectedA}
            onInput={handleInputA}
            onSelect={handleSelectA}
            suggestions={suggestionsA}
            showSuggestions={showA}
            onFocus={() => suggestionsA.length > 0 && setShowA(true)}
            containerRef={refA}
          />
          <div className="flex items-end justify-center pb-2 text-gray-400 font-bold text-lg flex-shrink-0">
            vs
          </div>
          <VaccineAutocomplete
            label="Vaccine B"
            value={queryB}
            selectedVaccine={selectedB}
            onInput={handleInputB}
            onSelect={handleSelectB}
            suggestions={suggestionsB}
            showSuggestions={showB}
            onFocus={() => suggestionsB.length > 0 && setShowB(true)}
            containerRef={refB}
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={!selectedA || !selectedB || loading}
            className="bg-accent hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Compare
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

      {loading && <LoadingSpinner message="Loading vaccine profiles..." />}

      {hasResults && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <SummaryCard profile={profileA} label="Vaccine A" colorClass="border-teal-300" />
            <SummaryCard profile={profileB} label="Vaccine B" colorClass="border-amber-300" />
          </div>

          {/* Venn diagram + gene comparison */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="font-semibold text-gray-700 text-sm">Gene Comparison</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {shared.length >= 2 && (
                  <Link
                    to={`/vacnet?vo=${encodeURIComponent(profileA.vo_id)}`}
                    className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    View in VacNet
                  </Link>
                )}
                <button
                  onClick={handleExportCsv}
                  className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>

            <VennDiagram
              countA={uniqueA.length}
              countShared={shared.length}
              countB={uniqueB.length}
              nameA={profileA.name}
              nameB={profileB.name}
            />

            <div className="flex gap-3 flex-col sm:flex-row">
              <GeneColumn
                title={`Unique to A`}
                genes={uniqueA}
                colorClass="bg-teal-50"
                textClass="text-teal-700"
              />
              <GeneColumn
                title="Shared"
                genes={shared}
                colorClass="bg-gray-100"
                textClass="text-gray-700"
              />
              <GeneColumn
                title={`Unique to B`}
                genes={uniqueB}
                colorClass="bg-amber-50"
                textClass="text-amber-700"
              />
            </div>

            {genesA.size === 0 && genesB.size === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No gene data available for either vaccine.
              </p>
            )}
          </div>
        </div>
      )}

      {!hasResults && !loading && !error && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>Select two vaccines above to compare their gene profiles.</p>
          <p className="mt-1 text-xs">
            Click <strong>Try Example</strong> to compare COVID-19 vaccine vs Influenza vaccine.
          </p>
        </div>
      )}
    </div>
  )
}
