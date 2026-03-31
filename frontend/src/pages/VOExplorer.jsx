import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import VOTree from '../components/VOTree.jsx'

export default function VOExplorer() {
  const [selectedVo, setSelectedVo] = useState(null) // vo_id string
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Search state (for tree filter — passed as hint to user; actual filtering is in VOTree)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef(null)
  // Request counter to discard stale responses when selections change rapidly
  const requestIdRef = useRef(0)

  function handleSelect(voId) {
    if (voId === selectedVo) return
    setSelectedVo(voId)
    setProfile(null)
    setLoading(true)
    setError(null)
    const thisRequest = ++requestIdRef.current
    api.vaccineProfile(voId)
      .then((data) => {
        if (requestIdRef.current === thisRequest) setProfile(data)
      })
      .catch((err) => {
        if (requestIdRef.current === thisRequest) setError(err.message)
      })
      .finally(() => {
        if (requestIdRef.current === thisRequest) setLoading(false)
      })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-teal-dark">VO Explorer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse the Vaccine Ontology (VO) hierarchy and view vaccine profiles for terms with gene data.
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left panel: VO Tree */}
        <div className="w-2/5 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Vaccine Ontology
            </h2>
            <div className="relative" ref={searchRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tree (use Ctrl+F in browser)..."
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-teal-500 pr-7"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  aria-label="Clear search"
                >
                  x
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-[10px] text-gray-400 mt-1">
                Use browser Ctrl+F to search within this panel
              </p>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <VOTree
              onSelect={handleSelect}
              selectedIds={selectedVo ? [selectedVo] : []}
              multiSelect={false}
            />
          </div>
        </div>

        {/* Right panel: Vaccine details */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
          {!selectedVo && !loading && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-gray-400">Select a vaccine from the tree</p>
              <p className="text-xs text-gray-300 mt-1">
                Teal-highlighted entries have gene association data
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
          )}

          {loading && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center" style={{ minHeight: 200 }}>
              <LoadingSpinner message="Loading vaccine profile..." />
            </div>
          )}

          {profile && !loading && (
            <>
              {/* Header card */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-xl font-bold text-teal-dark capitalize leading-tight">{profile.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{profile.vo_id}</p>
                  </div>
                  <Link
                    to={`/vacnet?vo=${encodeURIComponent(profile.vo_id)}`}
                    className="bg-accent hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded text-sm transition-colors flex-shrink-0"
                  >
                    View in VacNet
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-teal-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-teal-dark">{profile.total_mentions?.toLocaleString() ?? 0}</div>
                    <div className="text-xs text-gray-500">Mentions</div>
                  </div>
                  <div className="bg-teal-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-teal-dark">{profile.pmid_count?.toLocaleString() ?? 0}</div>
                    <div className="text-xs text-gray-500">PMIDs</div>
                  </div>
                  <div className="bg-blue-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-blue-700">{profile.top_genes?.length ?? 0}</div>
                    <div className="text-xs text-gray-500">Genes</div>
                  </div>
                  <div className="bg-amber-50 rounded p-3 text-center">
                    <div className="text-lg font-bold text-amber-700">{profile.top_drugs?.length ?? 0}</div>
                    <div className="text-xs text-gray-500">Drugs</div>
                  </div>
                </div>
              </div>

              {/* Top genes */}
              {profile.top_genes?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-700 text-sm">Top Associated Genes</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Click a gene to view co-occurrence evidence with this vaccine</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Gene</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profile.top_genes.map((g) => (
                        <tr key={g.gene} className="hover:bg-teal-50/20">
                          <td className="px-4 py-2 font-medium text-teal-dark">{g.gene}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{g.pmid_count?.toLocaleString()}</td>
                          <td className="px-4 py-2 text-center">
                            <Link
                              to={`/vacpair?vo=${encodeURIComponent(profile.vo_id)}&gene=${encodeURIComponent(g.gene)}`}
                              className="text-teal-600 hover:text-teal-800 text-xs font-medium hover:underline"
                            >
                              VacPair
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top drugs */}
              {profile.top_drugs?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 bg-amber-50">
                    <h3 className="font-semibold text-amber-800 text-sm">Top Associated Drugs</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Drug</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">DrugBank ID</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profile.top_drugs.map((d) => (
                        <tr key={d.drugbank_id} className="hover:bg-amber-50/20">
                          <td className="px-4 py-2 font-medium text-amber-800 capitalize">{d.drug_term}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs font-mono">{d.drugbank_id}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{d.shared_pmids?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top diseases */}
              {profile.top_diseases?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
                    <h3 className="font-semibold text-red-800 text-sm">Top Associated Diseases</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Disease</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">HDO ID</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profile.top_diseases.map((d) => (
                        <tr key={d.hdo_id} className="hover:bg-red-50/20">
                          <td className="px-4 py-2 font-medium text-red-800 capitalize">{d.hdo_term}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs font-mono">{d.hdo_id}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{d.shared_pmids?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {profile.top_genes?.length === 0 && profile.top_drugs?.length === 0 && profile.top_diseases?.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm shadow-sm">
                  No associations found for this vaccine in the current database.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
