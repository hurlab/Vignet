import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

export default function Explore() {
  const [vaccines, setVaccines] = useState([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Explore Vaccines</h1>
        <p className="text-gray-500 text-sm mt-1">
          Browse {total.toLocaleString()} vaccines mined from PubMed using the Vaccine Ontology (VO).
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
                  <tr key={v.vo_id} className="border-b border-gray-100 hover:bg-teal-50/30">
                    <td className="px-4 py-2.5 font-medium text-teal-dark">{v.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{v.vo_id}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{v.mention_count?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{v.pmid_count?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Link
                        to={`/vaccine?vo=${encodeURIComponent(v.vo_id)}`}
                        className="text-teal-600 hover:text-teal-800 text-xs font-medium hover:underline"
                      >
                        View
                      </Link>
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
    </div>
  )
}
