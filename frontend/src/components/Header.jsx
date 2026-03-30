import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const activeLinks = [
  { label: 'Explore', to: '/explore' },
  { label: 'Vaccine', to: '/vaccine' },
  { label: 'VacNet', to: '/vacnet' },
]

const comingSoonLinks = [
  { label: 'VacPair' },
  { label: 'Enrichment' },
  { label: 'Compare' },
  { label: 'VacSummarAI' },
  { label: 'AnalyzeText' },
  { label: 'VO Explorer' },
  { label: 'Assistant' },
  { label: 'API Docs' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="bg-teal-dark text-white flex-shrink-0 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:text-amber-200 transition-colors flex-shrink-0"
        >
          <img src="/vignet/favicon.svg" alt="" className="w-6 h-6" />
          Vignet
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 flex-1 overflow-hidden">
          {activeLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-2 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* Coming soon indicator */}
          <span className="mx-2 h-5 w-px bg-teal-600" />
          <span
            className="px-2 py-1 rounded text-[11px] font-medium text-teal-400 cursor-default whitespace-nowrap"
            title={comingSoonLinks.map(l => l.label).join(', ')}
          >
            +{comingSoonLinks.length} more coming soon
          </span>
        </nav>

        {/* Right side — link to Ignet */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <a
            href="/ignet/"
            className="text-teal-200 text-[11px] hover:text-white transition-colors"
          >
            Ignet
          </a>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden flex flex-col justify-center items-center gap-1 ml-auto p-1"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-teal-dark border-t border-teal-700 px-4 py-3 flex flex-col gap-1">
          {activeLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="border-t border-teal-700 mt-2 pt-2">
            <p className="px-3 py-1 text-[11px] text-teal-400 uppercase tracking-wide">Coming Soon</p>
            {comingSoonLinks.map(({ label }) => (
              <span
                key={label}
                className="block px-3 py-2 rounded text-sm font-medium text-teal-500 cursor-not-allowed"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="border-t border-teal-700 mt-2 pt-2">
            <a
              href="/ignet/"
              className="block px-3 py-2 rounded text-sm text-teal-200 hover:text-white"
            >
              Go to Ignet
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
