// Split text into plain / matched runs so a component can wrap matches in <mark>
// without dangerouslySetInnerHTML. The match rule mirrors the API's
// _select_matching_sentences (api/routes/vaccine.py in Ignet): case-insensitive,
// whole token (no letter or digit on either side), longest phrase first. Keep the
// two in step, or a sentence can be selected for a phrase this never marks.

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function splitHighlights(text, phrases) {
  if (!text) return []
  const words = [...new Set((phrases ?? []).filter(Boolean).map((p) => String(p).trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length)
  if (words.length === 0) return [{ text, match: false }]

  let re
  try {
    re = new RegExp(`(?<![A-Za-z0-9])(?:${words.map(escapeRegExp).join('|')})(?![A-Za-z0-9])`, 'gi')
  } catch {
    // Lookbehind is unsupported before Safari 16.4: show the text unmarked
    // rather than let the whole publications list fail to render.
    return [{ text, match: false }]
  }
  const parts = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), match: false })
    parts.push({ text: m[0], match: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false })
  return parts
}

// Append a page of papers, skipping PMIDs already shown: offset paging can shift
// when the nightly load adds newer papers between two requests.
export function appendNewPapers(prev, next) {
  const seen = new Set(prev.map((p) => p.pmid))
  return [...prev, ...next.filter((p) => !seen.has(p.pmid))]
}
