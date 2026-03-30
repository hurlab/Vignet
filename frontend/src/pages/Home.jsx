import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

const activeTools = [
  {
    title: 'Explore Vaccines',
    description: 'Browse and search 600+ vaccines mined from PubMed literature with publication counts.',
    to: '/explore',
    icon: '\ud83c\udf10',
  },
  {
    title: 'Vaccine Profile',
    description: 'View a vaccine\'s linked genes, publication evidence, and interaction data.',
    to: '/vaccine',
    icon: '\ud83d\udc89',
  },
  {
    title: 'VacNet',
    description: 'Interactive network visualization of vaccine-gene interaction clusters.',
    to: '/vacnet',
    icon: '\ud83d\udd2c',
  },
]

const comingSoonTools = [
  {
    title: 'VacPair',
    description: 'Query a vaccine-gene pair to see co-occurrence evidence and prediction scores.',
    icon: '\ud83d\udd17',
  },
  {
    title: 'Enrichment',
    description: 'Input a gene list to discover which vaccines are associated.',
    icon: '\ud83d\udcca',
  },
  {
    title: 'Compare',
    description: 'Compare two vaccines side by side: shared genes, unique pathways.',
    icon: '\u2696\ufe0f',
  },
  {
    title: 'VacSummarAI',
    description: 'AI-powered summarization of vaccine-gene literature.',
    icon: '\ud83e\udd16',
  },
  {
    title: 'VO Explorer',
    description: 'Browse the Vaccine Ontology hierarchy and terminology.',
    icon: '\ud83d\udd16',
  },
  {
    title: 'Vaccine Assistant',
    description: 'Ask questions about vaccine-gene interactions grounded in PubMed evidence.',
    icon: '\ud83d\udcac',
  },
  {
    title: 'Analyze Text',
    description: 'Paste biomedical text to detect vaccine-gene interactions.',
    icon: '\ud83d\udcdd',
  },
  {
    title: 'Analysis Report',
    description: 'Generate downloadable reports summarizing vaccine interaction analysis.',
    icon: '\ud83d\udcc4',
  },
]

function StatCard({ label, value, loading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-teal-dark">
        {loading ? (
          <span className="text-gray-300">&mdash;</span>
        ) : (
          value?.toLocaleString() ?? '&mdash;'
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    api.vaccineStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Hero */}
      <section className="text-center py-4 space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-teal-dark leading-tight">
          Vaccine-focused Integrative Gene Network
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm">
          Discover vaccine-gene co-occurrence and interaction networks from PubMed biomedical literature
          using natural language processing and ontology-based mining.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            to="/explore"
            className="bg-accent hover:bg-amber-600 text-white font-semibold px-5 py-2 rounded transition-colors text-sm"
          >
            Browse Vaccines
          </Link>
          <Link
            to="/vacnet"
            className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-5 py-2 rounded transition-colors text-sm"
          >
            Explore Networks
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-0">Database Statistics</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-3">Based on PubMed literature through 2025</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Vaccines (VO)" value={stats?.total_vaccines} loading={statsLoading} />
          <StatCard label="Linked Genes" value={stats?.total_genes} loading={statsLoading} />
          <StatCard label="PMIDs" value={stats?.total_pmids} loading={statsLoading} />
          <StatCard label="Sentences" value={stats?.total_sentences} loading={statsLoading} />
        </div>
      </section>

      {/* Active tools */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Available Tools</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {activeTools.map(({ title, description, to, icon }) => (
            <Link
              key={to}
              to={to}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-teal-400 hover:shadow-md transition-all group flex items-start gap-3"
            >
              <div className="text-xl flex-shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-teal-dark group-hover:text-teal text-sm">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon tools */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Coming Soon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {comingSoonTools.map(({ title, description, icon }) => (
            <div
              key={title}
              className="bg-white/60 border border-gray-200 rounded-lg px-3 py-2 opacity-50 cursor-not-allowed flex items-center gap-2"
            >
              <span className="text-base grayscale flex-shrink-0">{icon}</span>
              <span className="text-gray-500 text-xs font-medium truncate">{title}</span>
              <span className="text-[9px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded flex-shrink-0">Soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* Sister site */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Sister Project</h2>
        <a
          href="/ignet/"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all group"
        >
          <img src="/ignet/favicon.svg" alt="Ignet" className="w-10 h-10 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-800 group-hover:text-blue-600 text-sm mb-0.5">Ignet &mdash; Integrative Gene Network</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Explore gene-gene co-occurrence networks, BioBERT interaction predictions, and AI-powered literature summaries.</p>
          </div>
        </a>
      </section>

      {/* About */}
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-teal-dark mb-2 text-sm">About Vignet</h2>
        <p className="text-gray-600 text-xs leading-relaxed">
          Vignet is a vaccine-focused integrative gene network database built from co-occurrence mining
          of PubMed biomedical abstracts using the Vaccine Ontology (VO). It provides researchers
          with tools to explore vaccine-gene relationships, discover literature evidence for
          vaccine mechanisms, and analyze interaction networks across 600+ vaccines.
          Vignet complements Ignet's gene-centric analysis with a vaccine-focused perspective.
        </p>
      </section>

      {/* Citation */}
      <section>
        <blockquote className="border-l-4 border-teal-dark pl-4 py-2 bg-teal-50 rounded-r-md">
          <p className="text-xs text-gray-600 italic leading-relaxed">
            If you use Vignet in your research, please cite: <strong>Vignet: A vaccine-focused integrative gene
            network database from PubMed literature mining.</strong> University of North Dakota /
            University of Michigan, 2025&ndash;2026.
          </p>
        </blockquote>
      </section>
    </div>
  )
}
