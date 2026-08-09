// Single source of truth for the tool catalogue.
//
// Header.jsx (nav dropdowns + mobile panel) and Home.jsx (tool cards) both read
// from here. They used to keep independent hand-maintained lists, which drifted:
// six of the ten tools carried two different names depending on where you met
// them -- Explore/Explore Vaccines, Compare/Compare Vaccines, Ontology/VO
// Ontology, Assistant/Vaccine Assistant, Analyze/Analyze Text, Report/Generate
// Report. One list, one name each.
//
// Naming rule: the nav label is the page's own <h1>. A user who clicks
// "Analysis Report" lands on a page titled "Analysis Report" -- that anchors
// the label to something that already exists in the code, so a future rename
// has one obvious place to happen. Corollary rules inherited from Ignet: no
// group label may equal a tool label, and no group label may equal a route
// segment belonging to a tool in a different group.
//
// Grouping rule: by what the tool asks you for, verified against each page's
// actual input controls rather than its blurb. Compare Vaccines takes two
// vaccine names (not two gene sets, despite mirroring Ignet's /compare), so it
// sits under Vaccines; Analysis Report takes a gene list, so it sits under
// Gene Sets.
//
// Ordering rule: within a group, simple input first. Browse before one vaccine
// before two before a corpus; analyse before export. This is a stand-in for
// real usage data -- the site runs GA, so per-route page views should replace
// this ordering when someone pulls them.
//
// `homeCard: false` marks a destination that belongs in the nav but already has
// its own dedicated section on Home (the For AI Agents block), so it is not
// duplicated as a tool card.
//
// `external: true` marks a cross-app destination served by Ignet rather than a
// Vignet React route -- the API and MCP docs are shared between the two sites.
// Header renders these as plain <a>, not <NavLink>.

export const TOOL_GROUPS = [
  {
    id: 'vaccines',
    label: 'Vaccines',
    card: 'bg-teal-50 border-teal-200 hover:border-teal-400',
    tag: 'bg-teal-100 text-teal-800',
    tools: [
      {
        label: 'Explore Vaccines',
        to: '/explore',
        tagline: 'Browse and search vaccines',
        description: 'Browse, search, and view profiles for 600+ vaccines mined from PubMed literature.',
        icon: '🌐',
      },
      {
        label: 'Vaccine Profile',
        to: '/vaccine',
        tagline: 'One vaccine in detail',
        description: 'Look up a single vaccine by name or VO ID for its associated genes and literature evidence.',
        icon: '💉',
      },
      {
        label: 'VacPair',
        to: '/vacpair',
        tagline: 'Vaccine-gene evidence',
        description: 'Query a vaccine-gene pair to see co-occurrence evidence and prediction scores.',
        icon: '🔗',
      },
      {
        label: 'Compare Vaccines',
        to: '/compare',
        // Takes two vaccine names, not two gene sets -- hence Vaccines, not
        // Gene Sets, even though Ignet's /compare is a gene-set tool.
        tagline: 'Two vaccines side by side',
        description: 'Compare two vaccines side by side: shared genes, unique pathways.',
        icon: '⚖️',
      },
      {
        label: 'VacNet',
        to: '/vacnet',
        tagline: 'Interactive network view',
        description: 'Interactive network visualization of vaccine-gene-drug-disease interaction clusters, from a VO term or an uploaded PMID list.',
        icon: '🔬',
      },
    ],
  },
  {
    id: 'sets',
    label: 'Gene Sets',
    card: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    tag: 'bg-amber-100 text-amber-800',
    tools: [
      {
        label: 'Gene Enrichment',
        to: '/enrichment',
        tagline: 'Genes to vaccines',
        description: 'Input a gene list to discover which vaccines are associated.',
        icon: '📊',
      },
      {
        label: 'Analysis Report',
        to: '/report',
        tagline: 'Downloadable summary',
        description: 'Generate a downloadable HTML report with vaccine associations and gene analysis.',
        icon: '📄',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    card: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    tag: 'bg-violet-100 text-violet-800',
    tools: [
      {
        label: 'Vaccine Literature Assistant',
        to: '/assistant',
        tagline: 'Grounded literature Q&A',
        description: 'Ask questions about vaccine-gene interactions grounded in PubMed evidence.',
        icon: '💬',
      },
      {
        label: 'VacSummarAI',
        to: '/vacsummarai',
        tagline: 'AI literature summary',
        description: 'AI-powered summarization of vaccine-gene literature with follow-up chat.',
        icon: '🤖',
      },
      {
        label: 'Analyze Text',
        to: '/analyze',
        tagline: 'Extract genes from text',
        description: 'Paste biomedical text to detect genes and vaccine terms, predict interactions.',
        icon: '📝',
      },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    card: 'bg-slate-50 border-slate-200 hover:border-slate-400',
    tag: 'bg-slate-100 text-slate-700',
    tools: [
      {
        // Moved out of the flat list: VO Explorer takes no vaccine and no gene
        // set -- it browses the Vaccine Ontology vocabulary and pivots from a
        // VO class to its vaccines.
        label: 'VO Explorer',
        to: '/vo-explorer',
        tagline: 'Vaccine Ontology tree',
        description: 'Browse the Vaccine Ontology hierarchy tree and view vaccine details.',
        icon: '🔖',
      },
      {
        // Previously reachable only from the footer -- no nav entry at all.
        // Served by Ignet: the REST API is shared between the two sites.
        label: 'REST API',
        to: '/ignet/api-docs',
        external: true,
        tagline: 'JSON API reference',
        description: 'Programmatic access to Vignet and Ignet data via a JSON REST API.',
        icon: '⚙️',
        homeCard: false,
      },
      {
        // Ignet split MCP onto its own page; the footer still pointed at the
        // old /api-docs#mcp anchor, which no longer exists.
        label: 'MCP',
        to: '/ignet/mcp',
        external: true,
        tagline: 'Connect AI assistants',
        description: 'Connect Claude, ChatGPT, or other AI assistants directly to Vignet and Ignet data.',
        icon: '🔌',
        homeCard: false,
      },
    ],
  },
]

// Header nav: every group, every destination.
export const NAV_GROUPS = TOOL_GROUPS.map(({ id, label, tools }) => ({
  id,
  label,
  items: tools.map(({ label: itemLabel, to, tagline, external }) => ({
    label: itemLabel,
    to,
    desc: tagline,
    external,
  })),
}))

// Home cards: same catalogue, minus the destinations that already have their
// own section on that page.
export const HOME_TOOL_GROUPS = TOOL_GROUPS
  .map(group => ({ ...group, tools: group.tools.filter(t => t.homeCard !== false) }))
  .filter(group => group.tools.length > 0)
