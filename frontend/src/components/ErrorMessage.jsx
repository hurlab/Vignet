// Single source of truth for the inline error banner.
//
// This markup was hand-copied into ten page files. The duplication mattered less
// than what every copy was missing: role="alert". Without it a screen reader gets
// no announcement when a search fails, so "the request errored" and "there were no
// results" are indistinguishable -- the same gap LoadingSpinner had before it
// gained role="status".
//
// className is a passthrough, not decoration: two call sites need layout classes
// that belong to their parent's flow rather than to the banner itself
// (Explore's `mx-4 my-3`, VacNet's `mx-4 mt-3 flex-shrink-0`). Everything else
// passes nothing and gets the shared base.
//
// The base classes are Vignet's existing ones verbatim, so adopting this component
// changed no pixels. Ignet's equivalent uses `rounded-md px-4 py-3`; do not sync to
// it without meaning to restyle ten pages at once.

export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm ${className}`}
    >
      {message}
    </div>
  )
}
