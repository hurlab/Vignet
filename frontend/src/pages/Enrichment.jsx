import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const EXAMPLE_GENES = 'IFNG\nTNF\nIL2\nIL6\nIL10\nCD4\nCD8A\nSTAT1'

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

function parseGenes(text) {
  return [
    ...new Set(
      text
        .split(/[\n,\t\s]+/)
        .map((g) => g.trim().toUpperCase())
        .filter((g) => g.length > 0)
    ),
  ]
}

function GeneOverlapBar({ overlap, total }) {
  const pct = total > 0 ? Math.round((overlap / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden min-w-[60px]">
        <div
          className="h-2 bg-teal-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0 w-10 text-right">{pct}%</span>
    </div>
  )
}

export default function Enrichment() {
  const [geneText, setGeneText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleTryExample() {
    setGeneText(EXAMPLE_GENES)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const genes = parseGenes(geneText)
    if (genes.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    api.vaccineEnrichment(genes)
      .then(setResult)
      .catch((err) => { setError(err.message); setResult(null) })
      .finally(() => setLoading(false))
  }

  function handleExportCsv() {
    if (!result?.results) return
    const headers = ['vaccine_name', 'vo_id', 'gene_overlap', 'evidence_count', 'matched_genes']
    downloadCsv(
      result.results.map((r) => ({
        vaccine_name: r.vaccine_name ?? '',
        vo_id: r.vo_id ?? '',
        gene_overlap: r.gene_overlap ?? r.overlap_count ?? '',
        evidence_count: r.evidence_count ?? r.pmid_count ?? '',
        matched_genes: (r.matched_genes ?? []).join('; '),
      })),
      headers,
      'enrichment_results.csv'
    )
  }

  const parsedCount = parseGenes(geneText).length
  const top2 = result?.results?.slice(0, 2) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Gene Enrichment</h1>
        <p className="text-gray-500 text-sm mt-1">
          Input a gene list to discover which vaccines are most associated in PubMed literature.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <label className="block text-xs font-medium text-gray-600">
          Gene List
          <span className="text-gray-400 font-normal ml-1">(one per line, or comma / space separated)</span>
        </label>
        <textarea
          value={geneText}
          onChange={(e) => setGeneText(e.target.value)}
          placeholder="IFNG&#10;TNF&#10;IL6&#10;..."
          rows={6}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-500 resize-y"
        />
        {geneText.trim().length > 0 && (
          <p className="text-xs text-gray-400">
            {parsedCount} unique gene{parsedCount !== 1 ? 's' : ''} detected
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={parsedCount === 0 || loading}
            className="bg-accent hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Find Associated Vaccines
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

      {loading && <LoadingSpinner message="Running enrichment analysis..." />}

      {result && !loading && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-teal-dark">Enrichment Results</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-medium text-teal-dark">{result.input_genes?.length ?? parsedCount}</span> input genes
                  found associations with{' '}
                  <span className="font-medium text-teal-dark">{result.total_vaccines ?? result.results?.length ?? 0}</span>{' '}
                  vaccines
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {top2.length === 2 && (
                  <Link
                    to={`/compare?vo1=${encodeURIComponent(top2[0].vo_id)}&vo2=${encodeURIComponent(top2[1].vo_id)}`}
                    className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-3 py-1.5 rounded text-xs transition-colors"
                  >
                    Compare top 2
                  </Link>
                )}
                <button
                  onClick={handleExportCsv}
                  className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded text-sm transition-colors"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Results table */}
          {result.results?.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-700 text-sm">Associated Vaccines</h3>
                <p className="text-xs text-gray-400 mt-0.5">Ranked by gene overlap count</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">#</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Vaccine</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs w-24">Gene Overlap</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs w-24">Evidence</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Overlap Bar</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Matched Genes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.results.map((r, i) => {
                    const overlapCount = r.gene_overlap ?? r.overlap_count ?? 0
                    const totalInput = result.input_genes?.length ?? parsedCount
                    return (
                      <tr key={r.vo_id} className="hover:bg-teal-50/20">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/vaccine?vo=${encodeURIComponent(r.vo_id)}`}
                            className="font-medium text-teal-dark hover:text-teal hover:underline"
                          >
                            {r.vaccine_name ?? r.name ?? r.vo_id}
                          </Link>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{r.vo_id}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-teal-dark">
                          {overlapCount}
                          <span className="text-gray-400 font-normal">/{totalInput}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-600">
                          {(r.evidence_count ?? r.pmid_count ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 min-w-[100px]">
                          <GeneOverlapBar overlap={overlapCount} total={totalInput} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(r.matched_genes ?? []).slice(0, 8).map((g) => (
                              <span
                                key={g}
                                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded px-1.5 py-0.5"
                              >
                                {g}
                              </span>
                            ))}
                            {(r.matched_genes ?? []).length > 8 && (
                              <span className="text-xs text-gray-400">
                                +{(r.matched_genes ?? []).length - 8} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
              No vaccine associations found for the provided gene list.
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>Enter a list of gene symbols above to discover associated vaccines.</p>
          <p className="mt-1 text-xs">
            Click <strong>Try Example</strong> to pre-fill with immune-related genes.
          </p>
        </div>
      )}
    </div>
  )
}
