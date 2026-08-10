import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { TOOL_GROUPS, NAV_GROUPS, HOME_TOOL_GROUPS } from './tools.js'

// tools.js is the single source of truth for the tool catalogue, and its header
// comment states the rules it is meant to enforce. Those rules had been checked by
// a hand-written throwaway script twice (2026-08-06 and 2026-08-09) because they
// had nowhere to live. This is that home.
//
// The catalogue exists because six of ten tools once carried two different names
// depending on whether you met them in the header or on Home. These tests fail if
// that class of drift returns.

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')
const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools)
const INTERNAL = ALL_TOOLS.filter((t) => !t.external)

// Route table parsed from App.jsx: "/vaccine" -> "Vaccine".
function routeTable() {
  const app = readFileSync(join(SRC, 'App.jsx'), 'utf8')
  const table = {}
  for (const m of app.matchAll(/<Route\s+path="([^"]+)"\s+element={<(\w+)\s*\/>}/g)) {
    table['/' + m[1]] = m[2]
  }
  return table
}

// The page's own <h1>.
//
// Matching on `<h1 className=` rather than `<h1` is load-bearing, not cosmetic:
// Report.jsx contains a second, bare <h1> inside the template literal for the
// downloadable HTML report ("Vaccine Interaction Analysis Report"). A naive /<h1/
// match picks that one up first and reports drift that does not exist -- which is
// exactly what happened while writing these tests. The count assertion below keeps
// the heuristic honest if a page ever grows a second heading.
function pageHeading(component) {
  const file = join(SRC, 'pages', `${component}.jsx`)
  if (!existsSync(file)) return null
  const src = readFileSync(file, 'utf8')
  const found = [...src.matchAll(/<h1\s+className="[^"]*">([^<{]+)<\/h1>/g)].map((m) => m[1].trim())
  return { found, heading: found.length === 1 ? found[0] : null }
}

describe('tool catalogue — shape', () => {
  it('gives every tool the fields both consumers read', () => {
    for (const t of ALL_TOOLS) {
      expect(t.label, `label missing on ${t.to}`).toBeTruthy()
      expect(t.to, `to missing on ${t.label}`).toBeTruthy()
      expect(t.tagline, `tagline missing on ${t.label}`).toBeTruthy()
      expect(t.description, `description missing on ${t.label}`).toBeTruthy()
      expect(t.icon, `icon missing on ${t.label}`).toBeTruthy()
    }
  })

  it('gives every group an id, label and at least one tool', () => {
    for (const g of TOOL_GROUPS) {
      expect(g.id).toBeTruthy()
      expect(g.label).toBeTruthy()
      expect(g.tools.length).toBeGreaterThan(0)
    }
  })
})

describe('tool catalogue — no duplicate identities', () => {
  it('has no repeated tool label', () => {
    const labels = ALL_TOOLS.map((t) => t.label)
    expect(labels.filter((l, i) => labels.indexOf(l) !== i)).toEqual([])
  })

  it('has no repeated destination', () => {
    const tos = ALL_TOOLS.map((t) => t.to)
    expect(tos.filter((v, i) => tos.indexOf(v) !== i)).toEqual([])
  })

  it('has no repeated icon', () => {
    // Not cosmetic: the icon is how a card is recognised at a glance on Home.
    const icons = ALL_TOOLS.map((t) => t.icon)
    expect(icons.filter((v, i) => icons.indexOf(v) !== i)).toEqual([])
  })
})

describe('tool catalogue — naming rules from the file header', () => {
  it('never gives a group the same label as a tool', () => {
    const labels = new Set(ALL_TOOLS.map((t) => t.label))
    expect(TOOL_GROUPS.map((g) => g.label).filter((l) => labels.has(l))).toEqual([])
  })

  it('points every internal destination at a real route in App.jsx', () => {
    const routes = routeTable()
    expect(INTERNAL.filter((t) => !routes[t.to]).map((t) => t.to)).toEqual([])
  })

  it('labels each tool with the page’s own <h1>', () => {
    // "A user who clicks 'Analysis Report' lands on a page titled 'Analysis
    // Report'" -- the rule that anchors every label to something already in code.
    const routes = routeTable()
    const mismatched = []
    for (const t of INTERNAL) {
      const r = pageHeading(routes[t.to])
      expect(r, `no page file for ${t.to}`).not.toBeNull()
      expect(r.found.length, `${routes[t.to]}.jsx should have exactly one <h1 className=...>`).toBe(1)
      if (r.heading !== t.label) mismatched.push(`${t.to}: nav "${t.label}" vs h1 "${r.heading}"`)
    }
    expect(mismatched).toEqual([])
  })
})

describe('derived exports stay in step with the catalogue', () => {
  it('carries every group and destination into NAV_GROUPS', () => {
    expect(NAV_GROUPS.map((g) => g.id)).toEqual(TOOL_GROUPS.map((g) => g.id))
    expect(NAV_GROUPS.flatMap((g) => g.items).map((i) => i.to)).toEqual(ALL_TOOLS.map((t) => t.to))
  })

  it('drops only homeCard:false entries from HOME_TOOL_GROUPS', () => {
    const shown = HOME_TOOL_GROUPS.flatMap((g) => g.tools).map((t) => t.to)
    const expected = ALL_TOOLS.filter((t) => t.homeCard !== false).map((t) => t.to)
    expect(shown).toEqual(expected)
  })

  it('never emits an empty group on Home', () => {
    for (const g of HOME_TOOL_GROUPS) expect(g.tools.length).toBeGreaterThan(0)
  })
})
