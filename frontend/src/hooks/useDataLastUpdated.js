import { useEffect, useState } from 'react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatLong(d) {
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

function formatMonthYear(d) {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default function useDataLastUpdated() {
  const [state, setState] = useState({ raw: null, longFormat: null, monthYear: null })

  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.data_last_updated) return
        const d = new Date(data.data_last_updated + 'T00:00:00Z')
        if (Number.isNaN(d.getTime())) return
        setState({
          raw: data.data_last_updated,
          longFormat: formatLong(d),
          monthYear: formatMonthYear(d),
        })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return state
}
