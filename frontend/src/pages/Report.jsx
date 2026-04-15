import { useState } from 'react'
import { api } from '../api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'

const EXAMPLE_GENES = 'ACE2\nTMPRSS2\nIL6\nTNF\nIFNG\nCD4\nCD8A\nNLRP3\nIL1B\nIL2'

function parseGeneList(raw) {
  return raw
    .split(/[\n,;]+/)
    .map((g) => g.trim().toUpperCase())
    .filter((g) => g.length > 0 && /^[A-Z][A-Z0-9]{0,9}$/.test(g))
}

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(d) {
  return d.toISOString().split('T')[0].replace(/-/g, '')
}

function CheckMark() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex-shrink-0">
      &#10003;
    </span>
  )
}

function SpinnerIcon() {
  return (
    <span className="inline-block w-5 h-5 border-2 border-teal-200 border-t-teal-dark rounded-full animate-spin flex-shrink-0" />
  )
}

export default function Report() {
  const [geneText, setGeneText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [phases, setPhases] = useState([]) // { label, done, error }
  const [reportData, setReportData] = useState(null)
  const [error, setError] = useState(null)

  function loadExample() {
    setGeneText(EXAMPLE_GENES)
    setReportData(null)
    setPhases([])
  }

  async function handleGenerate() {
    const genes = parseGeneList(geneText)
    if (genes.length === 0) {
      setError('Please enter at least one valid gene symbol.')
      return
    }
    setError(null)
    setGenerating(true)
    setReportData(null)

    const phaseList = [
      { label: 'Finding vaccine associations...', done: false, error: false },
      { label: 'Analyzing gene interactions...', done: false, error: false },
      { label: 'Generating AI summary...', done: false, error: false },
    ]
    setPhases([...phaseList])

    const results = { vaccineAssoc: null, enrichment: null, summary: null, genes }

    // Phase 1: vaccine enrichment
    try {
      results.vaccineAssoc = await api.vaccineEnrichment(genes)
    } catch (e) {
      results.vaccineAssocError = e.message
    }
    phaseList[0] = { ...phaseList[0], done: true, error: !!results.vaccineAssocError }
    setPhases([...phaseList])

    // Phase 2: gene interaction enrichment
    try {
      results.enrichment = await api.enrichment(genes)
    } catch (e) {
      results.enrichmentError = e.message
    }
    phaseList[1] = { ...phaseList[1], done: true, error: !!results.enrichmentError }
    setPhases([...phaseList])

    // Phase 3: AI summary
    try {
      const data = await api.summarize({ genes })
      results.summary = data?.Summary?.reply ?? data?.summary?.reply ?? data?.summary ?? null
    } catch (e) {
      results.summaryError = e.message
    }
    phaseList[2] = { ...phaseList[2], done: true, error: !!results.summaryError }
    setPhases([...phaseList])

    results.generatedAt = new Date()
    setReportData(results)
    setGenerating(false)
  }

  function buildReportHtml(data) {
    const dateStr = data.generatedAt.toLocaleString()
    const geneTagsHtml = data.genes.map((g) => `<span class="tag gene">${g}</span>`).join(' ')

    let vaccineSection = '<p style="color:#888;font-size:13px;">Vaccine association data not available.</p>'
    if (data.vaccineAssoc) {
      const vaccines = data.vaccineAssoc.vaccines ?? data.vaccineAssoc.results ?? []
      if (vaccines.length > 0) {
        const rows = vaccines.slice(0, 20).map((v) => `
          <tr>
            <td>${escapeHtml(v.name ?? v.vaccine_name ?? v.vo_id ?? 'N/A')}</td>
            <td>${escapeHtml(v.vo_id ?? '')}</td>
            <td>${escapeHtml(v.gene_overlap ?? v.overlap ?? v.count ?? 'N/A')}</td>
            <td>${escapeHtml(v.total_evidence ?? v.pmid_count ?? v.shared_pmids ?? 'N/A')}</td>
          </tr>`).join('')
        vaccineSection = `
          <table>
            <thead><tr><th>Vaccine</th><th>VO ID</th><th>Gene Overlap</th><th>PMIDs</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
      }
    }

    let interactionSection = '<p style="color:#888;font-size:13px;">Interaction analysis data not available.</p>'
    if (data.enrichment) {
      const pairs = data.enrichment.interactions ?? data.enrichment.pairs ?? []
      const coverage = data.enrichment.coverage_pct ?? (data.enrichment.coverage != null ? data.enrichment.coverage * 100 : null)
      if (coverage != null) {
        interactionSection += `<p style="font-size:13px;">Gene coverage: <strong>${coverage.toFixed(0)}%</strong></p>`
      }
      if (pairs.length > 0) {
        const rows = pairs.slice(0, 20).map((p) => `
          <tr>
            <td>${escapeHtml(p.gene1 ?? p.Gene1 ?? 'N/A')}</td>
            <td>${escapeHtml(p.gene2 ?? p.Gene2 ?? 'N/A')}</td>
            <td>${escapeHtml(p.max_score != null ? (p.max_score * 100).toFixed(0) + '%' : p.evidence_count ?? p.count ?? 'N/A')}</td>
          </tr>`).join('')
        interactionSection = `
          <table>
            <thead><tr><th>Gene 1</th><th>Gene 2</th><th>Score / Count</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`
      }
    }

    const summarySection = data.summary
      ? `<p style="font-size:14px;line-height:1.6;color:#333;">${escapeHtml(data.summary)}</p>`
      : '<p style="color:#888;font-size:13px;">AI summary not available.</p>'

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Vignet Report</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
  h1 { color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 8px; }
  h2 { color: #0f766e; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #f0fdfa; text-align: left; padding: 8px; border: 1px solid #ddd; font-size: 13px; }
  td { padding: 8px; border: 1px solid #ddd; font-size: 13px; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin: 2px; }
  .gene { background: #dbeafe; color: #1e40af; }
  .vaccine { background: #f0fdfa; color: #0f766e; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
</style>
</head>
<body>
  <h1>Vaccine Interaction Analysis Report</h1>
  <p style="color:#666;font-size:13px;">Generated: ${escapeHtml(dateStr)} &mdash; Source: Vignet (ignet.org/vignet)</p>
  <h2>Gene List (${data.genes.length} genes)</h2>
  <p>${geneTagsHtml}</p>
  <h2>Vaccine Associations</h2>
  ${vaccineSection}
  <h2>Gene Interaction Analysis</h2>
  ${interactionSection}
  <h2>AI-Generated Summary</h2>
  ${summarySection}
  <h2>Methodology</h2>
  <p style="font-size:13px;line-height:1.6;color:#555;">
    Vaccine associations are derived from co-occurrence mining of PubMed biomedical abstracts using
    the Vaccine Ontology (VO). Gene interaction predictions use BioBERT-based NLP models trained on
    curated biomedical sentence pairs. AI summaries are generated using large language models grounded
    in PubMed literature. Data reflects PubMed coverage through 2025.
  </p>
  <div class="footer">
    <p>Vignet &mdash; Vaccine-focused Integrative Gene Network | University of North Dakota / University of Michigan</p>
    <p>Report generated on ${escapeHtml(dateStr)}</p>
  </div>
</body>
</html>`
  }

  function downloadReport() {
    if (!reportData) return
    const html = buildReportHtml(reportData)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vignet_report_${formatDate(reportData.generatedAt)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const genes = parseGeneList(geneText)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-dark">Analysis Report</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate a downloadable vaccine interaction analysis report for a list of genes.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-sm">Gene List Input</h2>
          <button
            onClick={loadExample}
            className="text-xs border border-teal-300 text-teal-700 hover:bg-teal-50 px-3 py-1 rounded-full transition-colors"
          >
            Load Example
          </button>
        </div>
        <textarea
          value={geneText}
          onChange={(e) => setGeneText(e.target.value)}
          placeholder="Enter gene symbols, one per line or comma-separated&#10;e.g. ACE2, TMPRSS2, IL6, TNF..."
          rows={6}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal-500 resize-y font-mono"
        />
        {genes.length > 0 && (
          <p className="text-xs text-gray-500">{genes.length} gene{genes.length !== 1 ? 's' : ''} parsed</p>
        )}
        {error && (
          <p className="text-red-600 text-xs">{error}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating || genes.length === 0}
          className="bg-accent hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Phase progress */}
      {phases.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Generation Progress</h3>
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              {phase.done
                ? <CheckMark />
                : generating && !phases.slice(0, i).every((p) => p.done)
                  ? <span className="w-5 h-5 flex-shrink-0" />
                  : <SpinnerIcon />
              }
              <span className={phase.done ? (phase.error ? 'text-red-600 line-through' : 'text-gray-700') : 'text-gray-400'}>
                {phase.label}
                {phase.done && phase.error && <span className="text-red-500 text-xs ml-2">(unavailable)</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Report preview */}
      {reportData && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Report header */}
            <div className="bg-teal-dark px-5 py-4 text-white">
              <h2 className="font-bold text-lg">Vaccine Interaction Analysis Report</h2>
              <p className="text-teal-200 text-xs mt-1">
                Generated {reportData.generatedAt.toLocaleString()} &mdash; Vignet
              </p>
            </div>

            <div className="p-5 space-y-5">
              {/* Gene list */}
              <section>
                <h3 className="font-semibold text-teal-dark text-sm mb-2">
                  Gene List ({reportData.genes.length} genes)
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {reportData.genes.map((g) => (
                    <span key={g} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded">{g}</span>
                  ))}
                </div>
              </section>

              {/* Vaccine associations */}
              <section>
                <h3 className="font-semibold text-teal-dark text-sm mb-2">Vaccine Associations</h3>
                {reportData.vaccineAssoc ? (
                  (() => {
                    const vaccines = reportData.vaccineAssoc.vaccines ?? reportData.vaccineAssoc.results ?? []
                    return vaccines.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Vaccine</th>
                              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">VO ID</th>
                              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Gene Overlap</th>
                              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">PMIDs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vaccines.slice(0, 15).map((v, i) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-teal-50/30">
                                <td className="px-3 py-2 font-medium text-teal-dark capitalize">
                                  {v.name ?? v.vaccine_name ?? 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-gray-500 text-xs font-mono">{v.vo_id ?? ''}</td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {v.gene_overlap ?? v.overlap ?? v.count ?? 'N/A'}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {v.total_evidence ?? v.pmid_count ?? v.shared_pmids ?? 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No vaccine associations found for the input genes.</p>
                    )
                  })()
                ) : (
                  <p className="text-xs text-red-500">
                    Vaccine association data could not be retrieved.
                    {reportData.vaccineAssocError && ` (${reportData.vaccineAssocError})`}
                  </p>
                )}
              </section>

              {/* Gene interaction analysis */}
              <section>
                <h3 className="font-semibold text-teal-dark text-sm mb-2">Gene Interaction Analysis</h3>
                {reportData.enrichment ? (
                  (() => {
                    const pairs = reportData.enrichment.interactions ?? reportData.enrichment.pairs ?? []
                    const coverage = reportData.enrichment.coverage_pct != null
                      ? reportData.enrichment.coverage_pct / 100
                      : reportData.enrichment.coverage ?? null
                    return (
                      <div className="space-y-2">
                        {coverage != null && (
                          <p className="text-xs text-gray-600">
                            Gene coverage: <strong>{(coverage * 100).toFixed(0)}%</strong>
                          </p>
                        )}
                        {pairs.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Gene 1</th>
                                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Gene 2</th>
                                  <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pairs.slice(0, 15).map((p, i) => (
                                  <tr key={i} className="border-b border-gray-50 hover:bg-teal-50/30">
                                    <td className="px-3 py-2 font-medium text-blue-700">{p.gene1 ?? p.Gene1}</td>
                                    <td className="px-3 py-2 font-medium text-amber-700">{p.gene2 ?? p.Gene2}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">
                                      {p.max_score != null ? `${(p.max_score * 100).toFixed(0)}%`
                                        : p.score != null ? `${(p.score * 100).toFixed(0)}%`
                                        : p.evidence_count ?? p.count ?? 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">No interaction pairs found.</p>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <p className="text-xs text-red-500">
                    Interaction data could not be retrieved.
                    {reportData.enrichmentError && ` (${reportData.enrichmentError})`}
                  </p>
                )}
              </section>

              {/* AI Summary */}
              <section>
                <h3 className="font-semibold text-teal-dark text-sm mb-2">AI-Generated Summary</h3>
                {reportData.summary ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{reportData.summary}</p>
                ) : (
                  <p className="text-xs text-red-500">
                    AI summary could not be generated.
                    {reportData.summaryError && ` (${reportData.summaryError})`}
                  </p>
                )}
              </section>

              {/* Methodology */}
              <section className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-600 text-sm mb-1">Methodology</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Vaccine associations are derived from co-occurrence mining of PubMed biomedical abstracts
                  using the Vaccine Ontology (VO). Gene interaction predictions use BioBERT-based NLP models
                  trained on curated biomedical sentence pairs. AI summaries are generated using large language
                  models grounded in PubMed literature. Data reflects PubMed coverage through 2025.
                </p>
              </section>
            </div>
          </div>

          {/* Download button */}
          <div className="flex justify-end">
            <button
              onClick={downloadReport}
              className="bg-accent hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded text-sm transition-colors flex items-center gap-2"
            >
              <span>Download Report</span>
              <span className="text-xs opacity-80">.html</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
