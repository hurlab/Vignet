# Vignet Changelog

All notable changes to the Vignet platform are documented here.

## [Unreleased]

### 2026-05-28 — Revert hurlab.med.und.edu HTTPS downgrade

TLS on `hurlab.med.und.edu` is restored (UND wildcard `*.med.und.edu`,
GlobalSign, valid through 2026-10-10). Reverted the 2026-05-06 mitigation:
outbound links in About and Contact pages restored from
`http://hurlab.med.und.edu` to `https://hurlab.med.und.edu`. Applied to both
React source (`frontend/src/pages/About.jsx`, `Contact.jsx`) and the
currently-served compiled bundles in `dist-react/assets/`. The Ignet sister
repo received the same revert in the same session. `TEMP_HTTPS_DOWNGRADE.md`
removed.

### 2026-05-06 — Temporary mitigation: hurlab.med.und.edu HTTPS → HTTP

Outbound links from About and Contact pages downgraded from
`https://hurlab.med.und.edu` to `http://hurlab.med.und.edu` while TLS on the
hurlab server is offline. **Reverted 2026-05-28** (see entry above).

The Ignet sister repo received the same mitigation in the same session.

## [1.0.1] — 2026-04-05

### Fixes
- Fixed Report page: correct API module usage, field mapping, summary parsing
- Fixed VacSummarAI response parsing (Summary.reply format)
- Fixed race condition in VO Explorer (requestIdRef pattern)
- Fixed Compare page example vaccine (VO_0000642 influenza, replacing empty VO_0004809)

### Documentation
- Added user manual with 14 screenshot references
- Added LICENSE (MIT)
- Revised README for public release

## [1.0.0] — 2026-03-31

### Initial Public Release
- React 19 SPA with Vite 8 and Tailwind CSS
- 10 interactive tools:
  - **Explore**: Browse vaccines with inline profile cards
  - **VacNet**: Multi-entity vaccine-gene network visualization
  - **VacPair**: Vaccine-gene pair evidence viewer
  - **Enrichment**: Gene list to ranked vaccine associations
  - **Compare**: Two-vaccine Venn diagram comparison
  - **VacSummarAI**: AI-powered vaccine literature summarization
  - **VO Explorer**: Full-page Vaccine Ontology hierarchy browser
  - **Vaccine Assistant**: Evidence-grounded Q&A
  - **Analyze Text**: Gene and vaccine term detection
  - **Report**: Downloadable analysis report
- Backed by Ignet database with 586K+ VO annotations
- 638 vaccines from Vaccine Ontology
- Shared Flask API with Ignet
- Sister project link to Ignet in header
