import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV_GROUPS } from '../data/tools.js'

// Nav groups come from the shared catalogue (src/data/tools.js) so the header
// and the Home page cannot drift apart on names or grouping again. The header
// used to keep its own flat list of ten links, and six of them disagreed with
// the name Home showed for the same route.
function Dropdown({ group }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const closeTimer = useRef(null)
  const openedByKeyboard = useRef(false)
  const location = useLocation()
  const isGroupActive = group.items.some(
    item => !item.external && location.pathname.startsWith(item.to)
  )

  // Close on navigation
  useEffect(() => { setOpen(false) }, [location.pathname])

  // When menu opens via keyboard, move focus to the first menuitem
  useEffect(() => {
    if (open && openedByKeyboard.current) {
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]')
      firstItem?.focus()
      openedByKeyboard.current = false
    }
  }, [open])

  // Close when focus moves outside the entire dropdown widget
  useEffect(() => {
    if (!open) return
    function handleFocusOut(e) {
      if (ref.current && !ref.current.contains(e.relatedTarget)) {
        setOpen(false)
      }
    }
    const node = ref.current
    node?.addEventListener('focusout', handleFocusOut)
    return () => node?.removeEventListener('focusout', handleFocusOut)
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Do not leak the close timer if the group unmounts while hovering out
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function handleEnter() {
    clearTimeout(closeTimer.current)
    setOpen(true)
  }

  function handleLeave() {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  function handleTriggerKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openedByKeyboard.current = true
      setOpen(prev => !prev)
    } else if (e.key === 'Escape') {
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      openedByKeyboard.current = true
      setOpen(true)
    }
  }

  const getMenuItems = useCallback(() => {
    return Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])
  }, [])

  function handleMenuKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    const items = getMenuItems()
    if (!items.length) return
    const focused = document.activeElement
    const currentIndex = items.indexOf(focused)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
      items[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
      items[prev]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    }
  }

  const menuId = `nav-menu-${group.label.toLowerCase().replace(/\s+/g, '-')}`
  const itemBase = 'block px-4 py-2 text-sm transition-colors'

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(prev => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap ${
          isGroupActive
            ? 'bg-teal-700 text-white'
            : 'text-teal-100 hover:bg-teal-800 hover:text-white'
        }`}
      >
        {group.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          ref={menuRef}
          aria-label={group.label}
          className="absolute top-full left-0 pt-1 z-50"
          onKeyDown={handleMenuKeyDown}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[220px]">
            {group.items.map(item => {
              const body = (
                <>
                  <div className="font-medium">{item.label}</div>
                  {item.desc && <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>}
                </>
              )
              // REST API and MCP live on Ignet, not in this router.
              return item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  role="menuitem"
                  className={`${itemBase} text-gray-700 hover:bg-gray-50 hover:text-teal-dark`}
                >
                  {body}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `${itemBase} ${
                      isActive
                        ? 'bg-teal-50 text-teal-dark font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-teal-dark'
                    }`
                  }
                >
                  {body}
                </NavLink>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

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

        {/* Nav dropdown groups */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_GROUPS.map(group => (
            <Dropdown key={group.label} group={group} />
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
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

      {/* Mobile dropdown — same catalogue, flattened under group headings */}
      {menuOpen && (
        <div className="md:hidden bg-teal-dark border-t border-teal-700 px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-teal-400">
                {group.label}
              </div>
              {group.items.map(item =>
                item.external ? (
                  <a
                    key={item.to}
                    href={item.to}
                    className="block px-3 py-2 rounded text-sm font-medium text-teal-100 hover:bg-teal-800 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2 rounded text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-700 text-white'
                          : 'text-teal-100 hover:bg-teal-800 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </div>
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
