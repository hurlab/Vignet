const faqs = [
  {
    q: 'What is Vignet?',
    a: 'Vignet (Vaccine-focused Integrative Gene Network) is a biomedical database for exploring vaccine-gene interaction networks mined from PubMed literature. It uses the Vaccine Ontology (VO) to identify vaccines and links them to genes through shared PubMed publications. Vignet is a sister project to Ignet, which provides the underlying gene-gene interaction network.',
  },
  {
    q: 'How are vaccine-gene associations determined?',
    a: 'Vignet identifies vaccine-gene associations through PubMed co-occurrence mining. The SciMiner NLP pipeline extracts both vaccine mentions (using VO) and gene mentions from PubMed abstracts. When a vaccine and gene appear in publications with overlapping PMIDs, they are linked. The strength of the association is measured by the number of shared PMIDs.',
  },
  {
    q: 'What is the Vaccine Ontology (VO)?',
    a: 'The Vaccine Ontology (VO) is a community-based biomedical ontology that standardizes vaccine names and classifications. It contains over 6,800 vaccine terms organized in a hierarchical structure. Vignet uses VO to identify and categorize vaccine mentions across PubMed literature, ensuring consistent and comprehensive vaccine entity recognition.',
  },
  {
    q: 'How is Vignet different from VIOLIN?',
    a: 'VIOLIN (Vaccine Investigation and Online Information Network) is a curated vaccine knowledge base with structured data on vaccine components, pathogens, and clinical information. Vignet complements VIOLIN by adding a literature-mined gene interaction perspective — showing which genes are associated with specific vaccines in the published literature. Both projects are funded by the same NIH grant (U24AI171008).',
  },
  {
    q: 'How do I explore vaccine-gene networks?',
    a: 'Use the Explore page to browse all 700+ vaccines with their mention counts and PMIDs. Click on any vaccine to see its profile, including the top associated genes. The VacNet page provides interactive network visualization where you can see vaccine-gene connections and toggle gene-gene interactions within the network.',
  },
  {
    q: 'Why do some vaccines show "No gene associations found"?',
    a: 'Gene associations require that the vaccine and gene mentions come from the same PubMed corpus. Currently, 226 out of 700+ vaccines have gene association data. Vaccines mined from different PubMed batches may lack overlapping PMIDs with the gene mining data. As the database is updated with new PubMed data, more vaccines will gain gene associations.',
  },
  {
    q: 'Can I use Vignet data programmatically?',
    a: 'Yes. Vignet shares the Ignet REST API with vaccine-specific endpoints. You can query vaccines, gene associations, and network data via the API. Additionally, AI assistants like Claude can access Vignet data directly through the MCP (Model Context Protocol) endpoint at https://ignet.org/api/v1/mcp.',
  },
  {
    q: 'How do I cite Vignet?',
    a: 'If you use Vignet in published research, please cite: Vignet: A vaccine-focused integrative gene network database from PubMed literature mining. University of North Dakota / University of Michigan, 2025-2026.',
  },
]

export default function Faqs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-teal-dark">Frequently Asked Questions</h1>
      <p className="text-gray-600 text-sm leading-relaxed">
        Common questions about Vignet, its data, and how to use the platform for
        vaccine-gene interaction research.
      </p>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold text-teal-dark">{item.q}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
