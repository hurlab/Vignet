import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'

// Added 2026-08-09, after measuring first: a bare recommended config produced 16
// findings on this codebase, not the wall that would have made it unadoptable.
// Four were real and are fixed; the rest are two rules whose default severity does
// not fit this app, downgraded below with reasons rather than switched off.
//
// The config errors on nothing today, so `npx eslint src` is a usable gate from
// day one. Warnings stay visible.

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // 10 hits, every one the same shape: fetch inside useEffect, then setState
      // with the result. That is this app's only data-fetching pattern -- there is
      // no react-query or loader layer -- so satisfying the rule means restructuring
      // how every page loads data, which is a design decision and not a lint fix.
      // Kept visible as a warning so the count is honest rather than suppressed.
      'react-hooks/set-state-in-effect': 'warn',

      // 2 hits, both Compare.jsx passing a debounce ref *object* into
      // makeInputHandler during render. The rule reads that as accessing a ref
      // while rendering, but `.current` is only touched inside the returned
      // handler, at event time. False positive here; left as a warning rather than
      // disabled so a genuine render-time ref read would still surface.
      'react-hooks/refs': 'warn',
    },
  },
  {
    // Tests read source files off disk to check catalogue invariants.
    files: ['src/**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
]
