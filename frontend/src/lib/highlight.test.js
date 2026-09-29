import { describe, it, expect } from 'vitest'
import { splitHighlights, appendNewPapers } from './highlight.js'

const marked = (parts) => parts.filter((p) => p.match).map((p) => p.text)
const joined = (parts) => parts.map((p) => p.text).join('')

describe('splitHighlights', () => {
  it('marks every occurrence, case-insensitively, and loses no text', () => {
    const text = 'RB51 was given; rb51 protected.'
    const parts = splitHighlights(text, ['rb51'])
    expect(marked(parts)).toEqual(['RB51', 'rb51'])
    expect(joined(parts)).toBe(text)
  })

  it('uses the same whole-token rule as the API', () => {
    expect(marked(splitHighlights('RB51-induced immunity', ['rb51']))).toEqual(['RB51'])
    expect(marked(splitHighlights('the rb51wboa strain', ['rb51']))).toEqual([])
  })

  it('prefers the longest phrase when phrases overlap', () => {
    const parts = splitHighlights('Brucella abortus RB51 vaccine', ['rb51', 'brucella abortus rb51'])
    expect(marked(parts)).toEqual(['Brucella abortus RB51'])
  })

  it('treats regex metacharacters literally', () => {
    expect(marked(splitHighlights('BCG (Tice) strain', ['bcg (tice)']))).toEqual(['BCG (Tice)'])
  })

  it('returns the whole text unmarked when there is nothing to mark', () => {
    expect(splitHighlights('plain text', [])).toEqual([{ text: 'plain text', match: false }])
    expect(splitHighlights('plain text', ['', null])).toEqual([{ text: 'plain text', match: false }])
    expect(splitHighlights('', ['x'])).toEqual([])
  })

  it('falls back to plain text if the pattern cannot be built (old Safari: no lookbehind)', () => {
    const Real = globalThis.RegExp
    globalThis.RegExp = function () { throw new SyntaxError('Invalid regular expression: invalid group specifier name') }
    try {
      expect(splitHighlights('RB51 given', ['rb51'])).toEqual([{ text: 'RB51 given', match: false }])
    } finally {
      globalThis.RegExp = Real
    }
  })
})

describe('appendNewPapers', () => {
  it('drops papers already on the list (a page can shift between requests)', () => {
    const prev = [{ pmid: 3 }, { pmid: 2 }]
    expect(appendNewPapers(prev, [{ pmid: 2 }, { pmid: 1 }]).map((p) => p.pmid)).toEqual([3, 2, 1])
  })
})

