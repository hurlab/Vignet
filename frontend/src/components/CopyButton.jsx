import { useState, useRef, useEffect } from 'react'

// Copy-to-clipboard for the identifier a page is *about* -- the VO ID under a
// profile heading. Deliberately not used in table rows or autocomplete lists: a
// button in every row is visual noise, and it multiplies the tab stops a keyboard
// user has to walk past to reach the actual content.
//
// The label doubles as the status readout ("Copy" -> "Copied"), wrapped in an
// aria-live region so the confirmation is announced rather than only shown.
// A failure path exists because navigator.clipboard rejects outside a secure
// context and when permission is denied -- silently doing nothing on click is
// worse than saying so.

export default function CopyButton({ text, label = 'Copy', className = '' }) {
  const [state, setState] = useState('idle') // 'idle' | 'copied' | 'failed'
  const timer = useRef(null)

  // Without this, the reset timer can fire after the parent unmounts (navigating
  // away while the "Copied" flash is still up) and set state on a dead component.
  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      setState('failed')
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  if (!text) return null

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${text} to clipboard`}
      title={`Copy ${text}`}
      className={`ml-1.5 align-middle text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-400 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-colors ${className}`}
    >
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : label}
      </span>
    </button>
  )
}
