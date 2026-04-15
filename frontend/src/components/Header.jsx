import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Explore', to: '/explore' },
  { label: 'VacNet', to: '/vacnet' },
  { label: 'VacPair', to: '/vacpair' },
  { label: 'Enrichment', to: '/enrichment' },
  { label: 'Compare', to: '/compare' },
  { label: 'VacSummarAI', to: '/vacsummarai' },
  { label: 'Ontology', to: '/vo-explorer' },
  { label: 'Assistant', to: '/assistant' },
  { label: 'Analyze', to: '/analyze' },
  { label: 'Report', to: '/report' },
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
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
          {navLinks.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-2 py-1 rounded text-[12px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <span className="text-teal-300 text-[11px]">v1.0.1</span>
          <a
            href="/ignet/"
            className="text-teal-200 text-[11px] hover:text-white transition-colors"
          >
            Ignet
          </a>
        </div>

        {/* Hamburger — mobile/tablet */}
        <button
          className="lg:hidden flex flex-col justify-center items-center gap-1 ml-auto p-1"
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
        <div className="lg:hidden bg-teal-dark border-t border-teal-700 px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          {navLinks.map(({ label, to }) => (
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
