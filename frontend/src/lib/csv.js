// Single source of truth for CSV export.
//
// This helper lived as a byte-identical copy inside Compare.jsx, VacPair.jsx and
// Enrichment.jsx. Nothing had drifted yet, but the escaping rules below are the
// kind of thing that gets hardened once and then silently applies to only one of
// three exports -- the same failure the tool catalogue had before src/data/tools.js
// (six tools carrying two different names). One copy, three importers.
//
// csvSafe does three separate jobs, and each matters:
//
//   1. Quote doubling      -- "" is how RFC 4180 escapes a quote inside a quoted
//                             field, so a vaccine name containing " survives.
//   2. Newline flattening  -- sentence text mined from PubMed abstracts contains
//                             real line breaks, which would otherwise split one
//                             record across several CSV rows.
//   3. Formula-injection   -- a leading = + - @ or tab makes Excel and Sheets treat
//      guard                the cell as a formula on open. Prefixing an apostrophe
//                            forces it to stay text. This is why every field is
//                            quoted unconditionally rather than only when needed.
//
// Do not "simplify" by quoting conditionally or dropping the apostrophe prefix
// without reading job 3 again.

export function csvSafe(val) {
  let v = String(val ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')
  // Guard on the first non-space character, not on position 0. Job 2 runs first,
  // so "\n=BAD()" arrives here as " =BAD()" -- a position-0 check sees the space
  // and lets it through. Excel itself treats a leading-space cell as text, but any
  // importer that trims leading whitespace (pandas skipinitialspace, several R
  // readers) re-arms the formula. Found by csv.test.js, not in the wild.
  if (/^\s*[=+\-@\t\r]/.test(v)) v = "'" + v
  return `"${v}"`
}

// rows: array of objects. headers: array of keys, doubling as the header row and
// the column order. Values are looked up as row[header].
export function downloadCsv(rows, headers, filename) {
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
