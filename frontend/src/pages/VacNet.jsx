import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import VOTree from '../components/VOTree.jsx'

export default function VacNet() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Selected VO IDs (array to support multi-select)
  const [selectedVoIds, setSelectedVoIds] = useState(() => {
    const vo = searchParams.get('vo')
    return vo ? [vo] : []
  })
  const [voInput, setVoInput] = useState(searchParams.get('vo') || '')

  const [multiSelect, setMultiSelect] = useState(false)
  const [geneGene, setGeneGene] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [network, setNetwork] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const cyRef = useRef(null)
  const containerRef = useRef(null)

  // Fetch network whenever selectedVoIds or geneGene changes
  useEffect(() => {
    if (selectedVoIds.length === 0) return
    setLoading(true)
    setError(null)
    setSelectedNode(null)

    const fetch = api.vaccineNetworkMulti(selectedVoIds, geneGene)

    fetch
      .then(setNetwork)
      .catch((err) => { setError(err.message); setNetwork(null) })
      .finally(() => setLoading(false))
  }, [selectedVoIds, geneGene])

  // Initialize / update Cytoscape
  useEffect(() => {
    if (!network || !containerRef.current) return
    if (network.nodes.length === 0) return

    let cy = null
    let cancelled = false

    import('cytoscape').then((mod) => {
      if (cancelled) return
      const cytoscape = mod.default

      const weightMap = {}
      network.edges.forEach((e) => { weightMap[e.target] = (weightMap[e.target] || 0) + e.weight })

      const elements = [
        ...network.nodes.map((n) => ({
          data: { id: n.id, label: n.label, type: n.type, weight: weightMap[n.id] || 0 },
        })),
        ...network.edges.map((e, i) => ({
          data: {
            id: `e${i}`,
            source: e.source,
            target: e.target,
            weight: e.weight,
            type: e.type || 'vaccine-gene',
          },
        })),
      ]

      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node[type="vaccine"]',
            style: {
              'background-color': '#0d9488',
              label: 'data(label)',
              'font-size': '11px',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              width: 40,
              height: 40,
              shape: 'diamond',
              color: '#134e4a',
              'font-weight': 'bold',
            },
          },
          {
            selector: 'node[type="gene"]',
            style: {
              'background-color': '#3b82f6',
              label: 'data(label)',
              'font-size': '9px',
              'text-valign': 'bottom',
              'text-margin-y': 4,
              width: 'mapData(weight, 1, 100, 16, 36)',
              height: 'mapData(weight, 1, 100, 16, 36)',
              color: '#1e3a5f',
            },
          },
          {
            selector: 'edge[type="vaccine-gene"]',
            style: {
              width: 'mapData(weight, 1, 100, 1, 5)',
              'line-color': '#94a3b8',
              'curve-style': 'bezier',
              opacity: 0.6,
            },
          },
          {
            selector: 'edge[type="gene-gene"]',
            style: {
              width: 'mapData(weight, 1, 100, 1, 4)',
              'line-color': '#f59e0b',
              'curve-style': 'bezier',
              'line-style': 'dashed',
              opacity: 0.5,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 'mapData(weight, 1, 100, 1, 5)',
              'line-color': '#94a3b8',
              'curve-style': 'bezier',
              opacity: 0.6,
            },
          },
          {
            selector: ':selected',
            style: {
              'border-width': 3,
              'border-color': '#f59e0b',
            },
          },
        ],
        layout: {
          name: 'cose',
          idealEdgeLength: 120,
          nodeOverlap: 20,
          refresh: 20,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: 8000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 0.25,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        },
        minZoom: 0.3,
        maxZoom: 3,
      })

      cy.on('tap', 'node', (evt) => {
        const data = evt.target.data()
        setSelectedNode(data)
      })

      cy.on('tap', (evt) => {
        if (evt.target === cy) setSelectedNode(null)
      })

      cyRef.current = cy
    })

    return () => {
      cancelled = true
      if (cy) cy.destroy()
    }
  }, [network])

  // Handle tree node selection
  function handleTreeSelect(voId) {
    if (multiSelect) {
      setSelectedVoIds((prev) => {
        if (prev.includes(voId)) {
          return prev.filter((id) => id !== voId)
        }
        return [...prev, voId]
      })
    } else {
      setSelectedVoIds([voId])
      setVoInput(voId)
      setSearchParams({ vo: voId })
    }
  }

  // Handle search form submission
  function handleSubmit(e) {
    e.preventDefault()
    const val = voInput.trim()
    if (!val) return

    if (/^VO_/i.test(val)) {
      if (multiSelect) {
        setSelectedVoIds((prev) =>
          prev.includes(val) ? prev : [...prev, val]
        )
      } else {
        setSelectedVoIds([val])
        setSearchParams({ vo: val })
      }
    } else {
      setLoading(true)
      setError(null)
      api.vaccineExplore(val, 1, 0)
        .then((data) => {
          if (data.vaccines?.length > 0) {
            const v = data.vaccines[0]
            if (multiSelect) {
              setSelectedVoIds((prev) =>
                prev.includes(v.vo_id) ? prev : [...prev, v.vo_id]
              )
            } else {
              setSelectedVoIds([v.vo_id])
              setVoInput(v.vo_id)
              setSearchParams({ vo: v.vo_id })
            }
          } else {
            setError('No vaccine found matching "' + val + '". Try browsing the Explore page.')
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  // Toggle multi-select mode — clear to single when turning off
  function handleMultiSelectToggle() {
    setMultiSelect((prev) => {
      if (prev) {
        // Turning off: keep only the first selected
        setSelectedVoIds((ids) => ids.slice(0, 1))
      }
      return !prev
    })
  }

  const hasSelection = selectedVoIds.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-teal-dark leading-tight">VacNet</h1>
            <p className="text-gray-500 text-xs">Interactive vaccine-gene interaction network</p>
          </div>

          {/* Multi-select toggle */}
          <button
            onClick={handleMultiSelectToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border transition-colors
              ${multiSelect
                ? 'bg-teal-dark text-white border-teal-dark'
                : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
              }
            `}
          >
            <span
              className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center flex-shrink-0
                ${multiSelect ? 'border-white' : 'border-gray-400'}
              `}
            >
              {multiSelect && (
                <svg className="w-2 h-2" fill="white" viewBox="0 0 12 12">
                  <path d="M1 6l3 3 7-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            Multi-select
            {multiSelect && selectedVoIds.length > 0 && (
              <span className="bg-white text-teal-dark rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                {selectedVoIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
          <input
            type="text"
            value={voInput}
            onChange={(e) => setVoInput(e.target.value)}
            placeholder="VO ID or name (e.g., VO_0004908 or covid-19)"
            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="bg-teal-dark hover:bg-teal text-white font-semibold px-3 py-1.5 rounded text-sm transition-colors whitespace-nowrap"
          >
            Load
          </button>
        </form>
      </div>

      {/* Main content: sidebar + graph */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar toggle button (mobile) */}
        <button
          className="md:hidden absolute top-20 left-2 z-10 bg-white border border-gray-300 rounded p-1 shadow text-xs text-gray-600"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Hide VO tree' : 'Show VO tree'}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* VO Tree Sidebar */}
        <div
          className={`flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden transition-all
            ${sidebarOpen ? 'w-72' : 'w-0'}
          `}
        >
          {sidebarOpen && (
            <>
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">VO Hierarchy</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs hidden md:block"
                  aria-label="Collapse sidebar"
                >
                  ◀
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-1 py-1">
                <VOTree
                  onSelect={handleTreeSelect}
                  selectedIds={selectedVoIds}
                  multiSelect={multiSelect}
                />
              </div>
            </>
          )}
        </div>

        {/* Expand sidebar button when collapsed (desktop) */}
        {!sidebarOpen && (
          <button
            className="hidden md:flex flex-shrink-0 w-6 items-center justify-center border-r border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xs"
            onClick={() => setSidebarOpen(true)}
            aria-label="Expand VO tree sidebar"
          >
            ▶
          </button>
        )}

        {/* Graph area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && (
            <div className="mx-4 mt-3 bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm flex-shrink-0">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center flex-1">
              <LoadingSpinner message="Loading network..." />
            </div>
          )}

          {!hasSelection && !loading && (
            <div className="flex items-center justify-center flex-1 text-gray-400 text-sm text-center px-8">
              <div>
                <p>Select a vaccine from the VO tree, or enter a VO ID above.</p>
                <p className="mt-1 text-xs">
                  Or browse from the{' '}
                  <Link to="/explore" className="text-teal-600 hover:underline">Explore</Link> page.
                </p>
              </div>
            </div>
          )}

          {network && !loading && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {network.edges.length === 0 ? (
                <div className="flex items-center justify-center flex-1 px-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm max-w-sm">
                    No gene associations found for this vaccine.
                    <p className="mt-2 text-xs">
                      This vaccine has no gene co-occurrence data yet.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Graph info bar */}
                  <div className="flex items-center justify-between px-4 py-1.5 flex-shrink-0 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                      {network.nodes.length} nodes &middot; {network.edges.length} edges
                    </p>
                    <p className="text-xs text-gray-400">Scroll to zoom &middot; drag to pan &middot; click for details</p>
                  </div>

                  {/* Cytoscape container */}
                  <div className="flex-1 relative bg-white overflow-hidden">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Selected node info panel */}
                    {selectedNode && (
                      <div className="absolute top-3 right-3 bg-white border border-gray-300 rounded-lg shadow-md p-3 max-w-xs z-10">
                        <h4 className="font-semibold text-teal-dark text-sm capitalize">{selectedNode.label}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Type: {selectedNode.type === 'vaccine' ? 'Vaccine' : 'Gene'}
                        </p>
                        {selectedNode.type === 'gene' && (
                          <a
                            href={`/ignet/gene?q=${encodeURIComponent(selectedNode.label)}`}
                            className="text-xs text-blue-600 hover:underline mt-1 block"
                          >
                            View in Ignet
                          </a>
                        )}
                        {selectedNode.type === 'vaccine' && (
                          <Link
                            to={`/vaccine?vo=${encodeURIComponent(selectedNode.id)}`}
                            className="text-xs text-teal-600 hover:underline mt-1 block"
                          >
                            View Profile
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom bar: gene-gene toggle + legend */}
                  <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2 flex items-center gap-6 bg-white">
                    {/* Gene-gene toggle */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                      <input
                        type="checkbox"
                        checked={geneGene}
                        onChange={(e) => setGeneGene(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500"
                      />
                      Show gene-gene interactions
                    </label>

                    <span className="h-4 w-px bg-gray-200" />

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-teal-600 rotate-45 inline-block" /> Vaccine
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-blue-500 rounded-full inline-block" /> Gene
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-6 h-0.5 bg-gray-400 inline-block" /> V-G edge
                      </span>
                      {geneGene && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-6 h-0.5 bg-amber-400 inline-block border-dashed border-t border-amber-400" /> G-G edge
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
