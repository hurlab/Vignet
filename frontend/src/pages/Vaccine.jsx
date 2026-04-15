import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function Vaccine() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [voInput, setVoInput] = useState(searchParams.get('vo') || '')
  const [voId, setVoId] = useState(searchParams.get('vo') || '')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!voId) return
    setLoading(true)
    setError(null)
    api.vaccineProfile(voId)
      .then(setProfile)
      .catch((err) => { setError(err.message); setProfile(null) })
      .finally(() => setLoading(false))
  }, [voId])

  function handleSubmit(e) {
    e.preventDefault()
    const val = voInput.trim()
    if (!val) return
    // If it looks like a VO ID (starts with VO_), use directly
    if (/^VO_/i.test(val)) {
      setVoId(val)
      setSearchParams({ vo: val })
    } else {
      // Search by name via explore API, use first result
      setLoading(true)
      setError(null)
      api.vaccineExplore(val, 1, 0)
        .then((data) => {
          if (data.vaccines?.length > 0) {
            const v = data.vaccines[0]
            setVoId(v.vo_id)
            setVoInput(v.vo_id)
            setSearchParams({ vo: v.vo_id })
          } else {
            setError('No vaccine found matching "' + val + '". Try browsing the Explore page.')
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Vaccine Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Search by vaccine name or VO ID to view associated genes and literature evidence.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg">
        <input
          type="text"
          value={voInput}
          onChange={(e) => setVoInput(e.target.value)}
          placeholder="VO ID or name (e.g., VO_0004908 or covid-19)"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          className="bg-teal-dark hover:bg-teal text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          Look Up
        </button>
      </form>

      {!voId && !loading && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>Search for a vaccine above, or browse from the <Link to="/explore" className="text-teal-600 hover:underline">Explore</Link> page.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">{error}</div>
      )}

      {loading && <LoadingSpinner message="Loading vaccine profile..." />}

      {profile && !loading && (
        <div className="space-y-6">
          {/* Vaccine card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-teal-dark capitalize">{profile.name}</h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{profile.vo_id}</p>
              </div>
              <Link
                to={`/vacnet?vo=${encodeURIComponent(profile.vo_id)}`}
                className="bg-teal-dark hover:bg-teal text-white font-medium px-3 py-1.5 rounded text-xs transition-colors flex-shrink-0"
              >
                View Network
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
                <h3 className="font-semibold text-gray-700 text-sm">Top Associated Genes</h3>
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
                <h3 className="font-semibold text-amber-800 text-sm">Top Associated Drugs</h3>
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
                <h3 className="font-semibold text-red-800 text-sm">Top Associated Diseases</h3>
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
