import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { splitHighlights, appendNewPapers } from '../lib/highlight.js'
import LoadingSpinner from './LoadingSpinner.jsx'
import ErrorMessage from './ErrorMessage.jsx'

const PAGE_SIZE = 10

function Highlighted({ text, phrases }) {
  return splitHighlights(text, phrases).map((part, i) =>
    part.match
      ? <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">{part.text}</mark>
      : <span key={i}>{part.text}</span>,
  )
}

function PaperCard({ paper }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <a
          href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
        >
          PMID {paper.pmid}
        </a>
        {paper.matched_phrases.map((p) => (
          <span key={p} className="text-[11px] bg-teal-50 text-teal-800 border border-teal-100 rounded px-1.5 py-0.5">
            {p}
          </span>
        ))}
      </div>
      {paper.text_available ? (
        <ul className="mt-1.5 space-y-1">
          {paper.sentences.map((s) => (
            <li key={s} className="text-sm text-gray-700 leading-relaxed">
              <Highlighted text={s} phrases={paper.matched_phrases} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-gray-400">
          Sentence text not available — view the abstract on PubMed.
        </p>
      )}
      {paper.text_source === 'phrase_match' && (
        <p className="mt-1 text-[11px] text-gray-400">Sentences from this paper that contain the matched term.</p>
      )}
    </li>
  )
}

export default function SourcePublications({ voId }) {
  const [papers, setPapers] = useState([])
  const [total, setTotal] = useState(0)
  // Rows fetched so far; differs from papers.length when appendNewPapers drops a repeat.
  const [nextOffset, setNextOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)

  // The parent remounts this component per term (key={voId}), so state starts
  // fresh here; the request id still discards a response for a superseded term.
  useEffect(() => {
    const thisRequest = ++requestIdRef.current
    api.vaccinePapers(voId, PAGE_SIZE, 0)
      .then((data) => {
        if (requestIdRef.current !== thisRequest) return
        setPapers(data.papers)
        setTotal(data.total_papers)
        setNextOffset(data.papers.length)
      })
      .catch((err) => { if (requestIdRef.current === thisRequest) setError(err.message) })
      .finally(() => { if (requestIdRef.current === thisRequest) setLoading(false) })
  }, [voId])

  function loadMore() {
    const thisRequest = requestIdRef.current
    setLoadingMore(true)
    setError(null)
    api.vaccinePapers(voId, PAGE_SIZE, nextOffset)
      .then((data) => {
        if (requestIdRef.current !== thisRequest) return
        setPapers((prev) => appendNewPapers(prev, data.papers))
        setNextOffset((n) => n + data.papers.length)
        // An empty page means the list shrank since the first request; stop offering more.
        if (data.papers.length === 0) setTotal(nextOffset)
      })
      .catch((err) => { if (requestIdRef.current === thisRequest) setError(err.message) })
      .finally(() => { if (requestIdRef.current === thisRequest) setLoadingMore(false) })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-700 text-sm">
          Source publications{!loading && ` (${total.toLocaleString()} ${total === 1 ? 'paper' : 'papers'})`}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Papers in which this term was identified, newest first. Matched terms are highlighted.
        </p>
      </div>
      {loading && <div className="py-6"><LoadingSpinner message="Loading publications..." /></div>}
      <ErrorMessage message={error} className="m-3" />
      {!loading && !error && papers.length === 0 && (
        <p className="px-4 py-4 text-sm text-gray-400">No publications found for this term.</p>
      )}
      {papers.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {papers.map((p) => <PaperCard key={p.pmid} paper={p} />)}
        </ul>
      )}
      {!loading && nextOffset < total && (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-sm font-medium text-teal-700 hover:text-teal-900 disabled:text-gray-400"
          >
            {loadingMore ? 'Loading…' : `Load more (${papers.length.toLocaleString()} of ${total.toLocaleString()})`}
          </button>
        </div>
      )}
    </div>
  )
}
