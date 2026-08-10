import { describe, it, expect } from 'vitest'
import { csvSafe } from './csv.js'

// csv.js carries a comment telling the next reader not to "simplify" the escaping.
// A comment cannot enforce that; these tests can. Each block below corresponds to
// one of the three jobs csvSafe does, so a change that drops one fails loudly
// instead of silently weakening an export.

describe('csvSafe — RFC 4180 quoting', () => {
  it('wraps every field in quotes, unconditionally', () => {
    // Unconditional quoting is what makes the injection guard below safe to apply
    // as a prefix. Quoting "only when needed" would reintroduce the hole.
    expect(csvSafe('plain')).toBe('"plain"')
    expect(csvSafe('has,comma')).toBe('"has,comma"')
  })

  it('doubles embedded quotes', () => {
    expect(csvSafe('has"quote')).toBe('"has""quote"')
    expect(csvSafe('"')).toBe('""""')
  })
})

describe('csvSafe — newline flattening', () => {
  // Sentence text mined from PubMed abstracts contains real line breaks. Left in,
  // one record would split across several CSV rows.
  it('collapses CR, LF and CRLF runs into a single space', () => {
    expect(csvSafe('multi\nline')).toBe('"multi line"')
    expect(csvSafe('crlf\r\nbreak')).toBe('"crlf break"')
    expect(csvSafe('many\n\n\nbreaks')).toBe('"many breaks"')
  })
})

describe('csvSafe — spreadsheet formula-injection guard', () => {
  // A leading = + - @ or tab makes Excel and Sheets evaluate the cell as a formula
  // on open. The apostrophe prefix forces it back to text. This is the job most
  // likely to be removed by someone who thinks it looks redundant.
  it.each(['=cmd|calc', '+1234', '-lead', '@handle', '\ttab'])(
    'prefixes an apostrophe to %j', (input) => {
      expect(csvSafe(input)).toBe(`"'${input}"`)
    }
  )

  it('does not prefix values that merely contain those characters', () => {
    expect(csvSafe('a=b')).toBe('"a=b"')
    expect(csvSafe('covid-19 vaccine')).toBe('"covid-19 vaccine"')
  })

  it('still guards a formula that arrives after newline flattening', () => {
    // Flattening runs first, so a leading newline must not hide a formula from
    // the guard by shifting it off position 0.
    expect(csvSafe('\n=BAD()')).toBe('"\' =BAD()"')
  })
})

describe('csvSafe — empty and non-string input', () => {
  it('renders null and undefined as an empty field, not the literal text', () => {
    expect(csvSafe(null)).toBe('""')
    expect(csvSafe(undefined)).toBe('""')
  })

  it('preserves numbers, including zero', () => {
    // Zero must survive: an evidence count of 0 is data, not absence.
    expect(csvSafe(0)).toBe('"0"')
    expect(csvSafe(3.14)).toBe('"3.14"')
  })
})
