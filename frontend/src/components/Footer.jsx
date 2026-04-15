export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          {/* Resources */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Resources
            </h4>
            <ul className="space-y-1">
              <li><a href="/vignet/about" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">About</a></li>
              <li><a href="/ignet/" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Ignet (Gene Network)</a></li>
              <li><a href="/ignet/api-docs" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">API Docs</a></li>
              <li><a href="/ignet/api-docs#mcp" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">MCP for AI</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Support
            </h4>
            <ul className="space-y-1">
              <li><a href="/vignet/faqs" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">FAQs</a></li>
              <li><a href="/vignet/contact" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Contact Us</a></li>
              <li><a href="https://github.com/hurlab/vignet/issues" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Report an Issue</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Legal
            </h4>
            <ul className="space-y-1">
              <li><a href="/ignet/disclaimer" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Disclaimer</a></li>
              <li><a href="/ignet/acknowledgements" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Acknowledgements</a></li>
              <li><a href="/ignet/links" className="text-gray-500 hover:text-teal-dark text-sm transition-colors">Links</a></li>
            </ul>
          </div>

          {/* Affiliated Institutions */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
              Institutions
            </h4>
            <div className="flex items-center gap-4">
              <a href="https://und.edu" target="_blank" rel="noopener noreferrer" title="University of North Dakota">
                <img src="/ignet/images/UND_logo.svg" alt="University of North Dakota" className="h-9 opacity-70 hover:opacity-100 transition-opacity" />
              </a>
              <a href="https://umich.edu" target="_blank" rel="noopener noreferrer" title="University of Michigan">
                <img src="/ignet/images/UM_logo.svg.png" alt="University of Michigan" className="h-9 opacity-70 hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <p className="text-center text-gray-400 text-xs leading-relaxed">
            Supported by NIH/NIAID{' '}
            <a href="https://reporter.nih.gov/search/OGGoe17zsEypH0sHLem22g/project-details/11109428" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">U24AI171008</a>{' '}
            VIOLIN 2.0: Vaccine Information and Ontology LInked kNowledgebase.
          </p>
          <p className="text-center text-gray-400 text-sm">
            Copyright &copy; 2025&ndash;2026 Vignet. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
