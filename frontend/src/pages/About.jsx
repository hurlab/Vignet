export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-teal-dark">About Vignet</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-bold text-teal-dark">What is Vignet?</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Vignet (Vaccine-focused Integrative Gene Network) is a biomedical database and web
          platform for exploring vaccine-gene interaction networks mined from PubMed literature.
          Built as a sister project to Ignet, Vignet focuses specifically on the relationships
          between vaccines and genes, leveraging the Vaccine Ontology (VO) for standardized
          vaccine identification across the biomedical literature.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Vignet uses the same SciMiner NLP pipeline and BioBERT interaction scoring as Ignet,
          extended with VO-based vaccine entity recognition. This enables researchers to discover
          which genes are co-mentioned with specific vaccines, explore vaccine-gene co-occurrence
          networks, and identify potential molecular mechanisms underlying vaccine responses.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-bold text-teal-dark">Database at a Glance</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-teal-dark font-semibold min-w-fit">Vaccines:</span>
            <span>700+ vaccines identified using the Vaccine Ontology (VO)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-dark font-semibold min-w-fit">Linked Genes:</span>
            <span>1,100+ genes with vaccine co-occurrence evidence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-dark font-semibold min-w-fit">PubMed Coverage:</span>
            <span>50,000+ PMIDs with vaccine-related content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-dark font-semibold min-w-fit">VO Hierarchy:</span>
            <span>6,800+ ontology nodes with parent-child relationships</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal-dark font-semibold min-w-fit">Gene Network:</span>
            <span>226 vaccines with gene-gene interaction network data</span>
          </li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-bold text-teal-dark">Relationship to VIOLIN and Ignet</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Vignet extends the VIOLIN (Vaccine Investigation and Online Information Network) project
          by integrating literature-mined gene interaction data with vaccine ontology annotations.
          While VIOLIN provides curated vaccine component and clinical data, Vignet adds a
          literature-driven gene network perspective, enabling researchers to explore the molecular
          landscape surrounding specific vaccines.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Ignet provides the underlying gene-gene interaction network (5.1 million interactions,
          18,000+ genes). Vignet layers vaccine annotations on top, connecting vaccines to genes
          through shared PubMed publications.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-bold text-teal-dark">Team</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Vignet is co-developed by two research groups with expertise in
          biomedical informatics, ontology engineering, and vaccine informatics.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-lg mx-auto">
          <a
            href="https://hurlab.med.und.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <img
              src="/ignet/images/hur.jpg"
              alt="Junguk Hur"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-teal-400 transition-colors mb-3"
            />
            <h3 className="font-semibold text-teal-dark text-sm group-hover:text-teal">Junguk Hur, Ph.D.</h3>
            <p className="text-xs text-gray-500 font-medium">Principal Investigator</p>
            <p className="text-xs text-teal-600 mt-0.5">Hur Lab &mdash; University of North Dakota</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Systems biology, network medicine, bioinformatics, and vaccine informatics.</p>
          </a>
          <a
            href="https://he-group.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <img
              src="/ignet/images/he.png"
              alt="Yongqun Oliver He"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 group-hover:border-teal-400 transition-colors mb-3"
            />
            <h3 className="font-semibold text-teal-dark text-sm group-hover:text-teal">Yongqun &ldquo;Oliver&rdquo; He, DVM, Ph.D.</h3>
            <p className="text-xs text-gray-500 font-medium">Co-Investigator</p>
            <p className="text-xs text-teal-600 mt-0.5">He Lab &mdash; University of Michigan</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Biomedical ontology engineering, vaccine informatics (VIOLIN, VO), and knowledge representation.</p>
          </a>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-bold text-teal-dark">Funding</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Vignet is supported by NIH/NIAID grant{' '}
          <a href="https://reporter.nih.gov/search/OGGoe17zsEypH0sHLem22g/project-details/11109428" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline hover:text-teal-800">U24AI171008</a>{' '}
          — VIOLIN 2.0: Vaccine Information and Ontology LInked kNowledgebase.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="text-lg font-bold text-teal-dark">How to Cite Vignet</h2>
        <blockquote className="border-l-4 border-teal-dark pl-4 text-sm text-gray-600 leading-relaxed italic">
          Vignet: A vaccine-focused integrative gene network database from PubMed literature mining.
          University of North Dakota / University of Michigan, 2025&ndash;2026.
        </blockquote>
      </div>
    </div>
  )
}
