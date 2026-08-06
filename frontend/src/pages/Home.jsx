import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import useDataLastUpdated from '../hooks/useDataLastUpdated'
import { HOME_TOOL_GROUPS } from '../data/tools.js'

// Tool cards, their names, their order and their group tints all come from the
// shared catalogue (src/data/tools.js) -- the same list the header nav renders.
// This page used to keep its own copy, which is how six tools ended up with two
// names each depending on whether you met them here or in the header.
//
// Groups deliberately straddle rows: the group sizes (4/2/3) do not align to a
// 3-column grid, and colour + tag carry the grouping instead of row breaks.

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
  const { monthYear } = useDataLastUpdated()
  const dataThrough = monthYear || '2026'

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
        <p className="text-xs text-gray-400 mt-0.5 mb-3">Based on PubMed literature through {dataThrough}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Vaccines (VO)" value={stats?.total_vaccines} loading={statsLoading} />
          <StatCard label="Linked Genes" value={stats?.total_genes} loading={statsLoading} />
          <StatCard label="PMIDs" value={stats?.total_pmids} loading={statsLoading} />
          <StatCard label="Sentences" value={stats?.total_sentences} loading={statsLoading} />
        </div>
      </section>

      {/* All tools */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOME_TOOL_GROUPS.flatMap(g =>
            g.tools.map(({ label, description, to, icon }) => (
              <Link
                key={to}
                to={to}
                className={`${g.card} border rounded-lg px-4 py-3 hover:shadow-md transition-all group flex items-start gap-3`}
              >
                <div className="text-xl flex-shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-teal-dark text-sm">{label}</h3>
                    {/* Non-colour cue: tint alone would be invisible to
                        colourblind users and on washed-out projectors. */}
                    <span className={`${g.tag} text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 flex-shrink-0`}>
                      {g.label}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{description}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* MCP */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">For AI Agents</h2>
        <a
          href="/ignet/mcp"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-400 hover:shadow-md transition-all group"
        >
          <div className="text-2xl flex-shrink-0">&#129302;</div>
          <div>
            <h3 className="font-semibold text-teal-dark group-hover:text-teal text-sm mb-0.5">MCP Endpoint</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Connect AI assistants to Vignet data via the Model Context Protocol at <code className="bg-gray-100 px-1 rounded">https://ignet.org/api/v1/mcp</code></p>
          </div>
        </a>
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
