import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

function VaccineProfile({ voId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setProfile(null)
    api.vaccineProfile(voId)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [voId])

  return (
    <div className="border border-teal-200 rounded-lg bg-teal-50/20 overflow-hidden">
      {/* Profile header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal-dark text-white">
        <h2 className="font-semibold text-sm">Vaccine Profile</h2>
        <button
          onClick={onClose}
          className="text-teal-100 hover:text-white text-xs font-medium px-2 py-1 rounded hover:bg-teal-700 transition-colors"
          aria-label="Close profile"
        >
          Close
        </button>
      </div>

      {loading && (
        <div className="p-6">
          <LoadingSpinner message="Loading vaccine profile..." />
        </div>
      )}

      {error && (
        <div className="mx-4 my-3 bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {profile && !loading && (
        <div className="p-4 space-y-4">
          {/* Vaccine card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-teal-dark capitalize">{profile.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{profile.vo_id}</p>
              </div>
              <Link
                to={`/vacnet?vo=${encodeURIComponent(profile.vo_id)}`}
                className="bg-teal-dark hover:bg-teal text-white font-medium px-3 py-1.5 rounded text-xs transition-colors flex-shrink-0"
              >
                View in VacNet
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
              <div className="bg-teal-50 rounded p-3 text-center">
                <div className="text-lg font-bold text-teal-dark">{profile.total_mentions?.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Mentions</div>
              </div>
              <div className="bg-teal-50 rounded p-3 text-center">
                <div className="text-lg font-bold text-teal-dark">{profile.pmid_count?.toLocaleString()}</div>
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
              <div className="bg-red-50 rounded p-3 text-center">
                <div className="text-lg font-bold text-red-700">{profile.top_diseases?.length ?? 0}</div>
                <div className="text-xs text-gray-500">Diseases</div>
              </div>
            </div>
          </div>

          {/* Top associated genes */}
          {profile.top_genes?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h4 className="font-semibold text-gray-700 text-sm">Top Associated Genes</h4>
                <p className="text-xs text-gray-400 mt-0.5">Genes co-mentioned with this vaccine in PubMed sentences</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Gene</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-500 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.top_genes.map((g) => (
                    <tr key={g.gene} className="border-b border-gray-50 hover:bg-teal-50/30">
                      <td className="px-4 py-2 font-medium text-teal-dark">{g.gene}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{g.pmid_count?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-center">
                        <a
                          href={`/ignet/gene?q=${encodeURIComponent(g.gene)}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                          title="View in Ignet"
                        >
                          Ignet
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {profile.top_genes?.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
              No gene associations found for this vaccine in the current database.
            </div>
          )}

          {/* Top associated drugs */}
          {profile.top_drugs?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-amber-50">
                <h4 className="font-semibold text-amber-800 text-sm">Top Associated Drugs</h4>
                <p className="text-xs text-gray-400 mt-0.5">Drugs co-mentioned with this vaccine in PubMed articles</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Drug</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">DrugBank ID</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.top_drugs.map((d) => (
                    <tr key={d.drugbank_id} className="border-b border-gray-50 hover:bg-amber-50/30">
                      <td className="px-4 py-2 font-medium text-amber-800 capitalize">{d.drug_term}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs font-mono">{d.drugbank_id}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{d.shared_pmids?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top associated diseases */}
          {profile.top_diseases?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
                <h4 className="font-semibold text-red-800 text-sm">Top Associated Diseases</h4>
                <p className="text-xs text-gray-400 mt-0.5">Diseases co-mentioned with this vaccine in PubMed articles</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Disease</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">HDO ID</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Shared PMIDs</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.top_diseases.map((d) => (
                    <tr key={d.hdo_id} className="border-b border-gray-50 hover:bg-red-50/30">
                      <td className="px-4 py-2 font-medium text-red-800 capitalize">{d.hdo_term}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs font-mono">{d.hdo_id}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{d.shared_pmids?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vaccines, setVaccines] = useState([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [selectedVo, setSelectedVo] = useState(() => searchParams.get('vo') || null)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.vaccineExplore(search, limit, offset)
      .then((data) => {
        setVaccines(data.vaccines || [])
        setTotal(data.total || 0)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [search, offset])

  function handleSearch(e) {
    e.preventDefault()
    setOffset(0)
    setSearch(query.trim())
  }

  function handleRowClick(voId) {
    setSelectedVo(voId)
    setSearchParams({ vo: voId })
    // Scroll to profile after brief render delay
    setTimeout(() => {
      document.getElementById('vaccine-profile-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleCloseProfile() {
    setSelectedVo(null)
    setSearchParams({})
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Explore Vaccines</h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse {total.toLocaleString()} vaccines mined from PubMed using the Vaccine Ontology (VO).
          Click any row to view its profile.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vaccines (e.g., BCG, COVID-19, malaria)..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          className="bg-teal-dark hover:bg-teal text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSearch(''); setOffset(0) }}
            className="text-gray-400 hover:text-gray-600 text-sm px-2"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading vaccines..." />
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Vaccine</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">VO ID</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Mentions</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">PMIDs</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((v) => (
                  <tr
                    key={v.vo_id}
                    onClick={() => handleRowClick(v.vo_id)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedVo === v.vo_id
                        ? 'bg-teal-50 border-l-2 border-l-teal-500'
                        : 'hover:bg-teal-50/30'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-teal-dark">{v.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{v.vo_id}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{v.mention_count?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{v.pmid_count?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleRowClick(v.vo_id)}
                        className="text-teal-600 hover:text-teal-800 text-xs font-medium hover:underline"
                      >
                        Profile
                      </button>
                      <span className="mx-1 text-gray-300">|</span>
                      <Link
                        to={`/vacnet?vo=${encodeURIComponent(v.vo_id)}`}
                        className="text-teal-600 hover:text-teal-800 text-xs font-medium hover:underline"
                      >
                        Network
                      </Link>
                    </td>
                  </tr>
                ))}
                {vaccines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      No vaccines found{search ? ` for "${search}"` : ''}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing {offset + 1}&ndash;{Math.min(offset + limit, total)} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 rounded text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 rounded text-sm border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inline vaccine profile (master-detail) */}
      {selectedVo && (
        <div id="vaccine-profile-section">
          <VaccineProfile voId={selectedVo} onClose={handleCloseProfile} />
        </div>
      )}
    </div>
  )
}
