# Vignet — Vaccine-focused Integrative Gene Network

![Vignet Home](docs/screenshots/home.png)

Vignet is an interactive web platform for exploring vaccine-gene associations extracted from biomedical literature using natural language processing and machine learning. It enables researchers to discover vaccine mechanisms, identify therapeutic targets, and analyze cross-vaccine gene networks at scale.

## Overview

Vignet answers critical questions in vaccine research:
- What genes does a vaccine interact with and through which biological pathways?
- How do different vaccines compare in their gene targets and mechanisms?
- Which vaccines are associated with a gene set from my research?
- What does the literature say about specific vaccine-gene interactions?

Built on **240,127 PubMed articles** and the **Vaccine Ontology**, Vignet combines literature mining, interactive visualization, and AI-powered analysis to accelerate vaccine research and drug discovery.

**Live Site**: https://ignet.org/vignet/

## Features

1. **Explore Vaccines** — Search and browse 638 vaccines with mention counts and gene associations
2. **VacNet** — Interactive network visualization of vaccine-gene-drug-disease relationships
3. **VacPair** — Query specific vaccine-gene pairs for co-occurrence evidence and prediction scores
4. **Gene Enrichment** — Upload a gene list and discover associated vaccines in literature
5. **Compare Vaccines** — Side-by-side analysis with shared vs. unique gene targets (Venn diagrams)
6. **VacSummarAI** — AI-powered summaries of vaccine-gene literature with follow-up Q&A
7. **VO Ontology Browser** — Navigate the complete Vaccine Ontology hierarchy with gene data indicators
8. **Vaccine Assistant** — Natural language Q&A about vaccine-gene interactions grounded in evidence
9. **Analyze Text** — Detect genes/vaccines in biomedical text and predict interactions via BioBERT
10. **Generate Report** — Create downloadable HTML reports analyzing vaccine associations for gene lists

## Tech Stack

**Frontend**:
- React 19, Vite 8, JavaScript (JSX)
- Tailwind CSS 3 for styling
- Cytoscape.js for network visualization
- Recharts for data visualization

**Backend**:
- Flask + Waitress (Python 3.12)
- RESTful API at `/api/v1/`
- MariaDB database (10.5+)

**Machine Learning & NLP**:
- BioBERT for protein interaction prediction
- SciBERT for biomedical named entity recognition
- GPT-4o for AI summarization and Q&A

**Data**:
- PubMed abstracts (240K+ articles, 2025 coverage)
- Vaccine Ontology (VO) — 6.8K nodes, 638 vaccine terms
- DrugBank — drug target interactions
- HDO (Human Disease Ontology) — disease terms

## Database

Vignet uses the shared `ignet` MariaDB database with these core tables:

| Table | Records | Description |
|-------|---------|-------------|
| `t_vo` | 586K | Vaccine mentions from PubMed with sentence context |
| `t_vo_hierarchy` | 6.8K | Vaccine Ontology tree structure |
| `t_vo_has_gene_data` | 638 | Lookup table: which VOs have gene associations |
| `t_gene_pairs` | 5.1M | Gene co-occurrence pairs with BioBERT scores |
| `t_gene_sentence_pairs` | 2.4M | Sentence-level gene pair evidence |

**Note**: The database schema is shared with Ignet and maintained in the [Ignet repository](https://github.com/hurlab/Ignet).

## API

### REST API

Access Vignet data programmatically at `https://ignet.org/api/v1/`

**Key Endpoints**:
- `GET /vaccine/search?q=covid` — Search vaccines
- `GET /vaccine/{vo_id}/genes` — Get genes for a vaccine
- `POST /pair/search` — Find vaccine-gene co-occurrence evidence
- `POST /enrichment/analyze` — Run enrichment on gene list
- `POST /text/analyze` — Detect genes/vaccines in text

**Documentation**: https://ignet.org/api/docs/

**Access**: Public and open; no authentication required. Rate limited to 100 requests/minute.

### MCP Endpoint for AI Assistants

Integrate Vignet with Claude and other AI systems via Model Context Protocol:

```
https://ignet.org/api/v1/mcp
```

Enables natural language queries about vaccine-gene interactions with automatic evidence citation and summarization.

## Installation (Local Development)

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.12+
- MariaDB 10.5+ (shared with Ignet)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev       # Dev server on http://localhost:5174
npm run build     # Production build to ../dist-react/
```

### Backend Setup
```bash
# Assuming the shared Ignet Flask API is running locally
# See Ignet repository for backend setup (port is configurable)

# Set VITE_API_PROXY_TARGET in frontend/.env to point at your backend,
# for example:
#   VITE_API_PROXY_TARGET=http://127.0.0.1:5000

# Test connectivity via the public API
curl https://ignet.org/api/v1/vaccine/search?q=covid
```

### Database
The database schema is defined in the Ignet repository:
```bash
# Clone Ignet to get schema
git clone https://github.com/hurlab/Ignet.git
# Import schema: scripts/schema_ignet.sql
```

## Deployment

Vignet is deployed as a static SPA served by Apache at `https://ignet.org/vignet/`,
with the Flask/Waitress backend (shared with Ignet) serving `/api/v1/` on the same host.

```bash
# Build static assets
cd frontend
npm run build          # outputs to ../dist-react/
```

Deploy the contents of `dist-react/` to your web server. The frontend calls a
same-origin `/api/v1/` path, so no runtime configuration is required in production.

### Development Environment Variables (frontend/.env)
```
# Target for the dev proxy; defaults to http://127.0.0.1:5000 if unset
VITE_API_PROXY_TARGET=http://127.0.0.1:5000
```

## Documentation

- **[User Manual](docs/USER_MANUAL.md)** — Complete guide to using all Vignet tools
- **[API Documentation](https://ignet.org/api/docs/)** — REST API reference
- **[MCP Integration](https://ignet.org/docs/mcp/)** — AI assistant integration guide
- **[Database Schema](https://github.com/hurlab/Ignet/blob/main/scripts/schema_ignet.sql)** — Complete schema definition

## Related Projects

- **[Ignet](https://github.com/hurlab/Ignet)** — General gene-gene interaction networks (sister project, shares database)
- **[VIOLIN](http://www.violinet.org/)** — Vaccine Information and Ontology Linked kNowledgebase
- **[Vaccine Ontology](https://bioportal.bioontology.org/ontologies/VO)** — Official VO documentation

## Data Sources & Citation

Vignet integrates:
- **PubMed**: 240,127 articles, 586K vaccine-gene mentions mined through 2025
- **Vaccine Ontology (VO)**: 638 vaccine terms organized in 6.8K node hierarchy
- **BioBERT**: Machine learning for protein interaction prediction
- **DrugBank**: Drug-gene-disease interactions

**Cite Vignet as**:

```
Vignet: A vaccine-focused integrative gene network database from
PubMed literature mining. Junguk Hur (University of North Dakota)
and Yongqun "Oliver" He (University of Michigan), 2025-2026.

Supported by NIH/NIAID U24AI171008 VIOLIN 2.0: Vaccine Information
and Ontology Linked kNowledgebase.
```

BibTeX:
```bibtex
@database{vignet2025,
  author = {Hur, Junguk and He, Yongqun},
  title = {Vignet: A vaccine-focused integrative gene network database},
  year = {2025},
  url = {https://ignet.org/vignet/},
  note = {Supported by NIH/NIAID U24AI171008}
}
```

## Funding

This project is supported by:

- **NIH/NIAID**: U24AI171008 — VIOLIN 2.0: Vaccine Information and Ontology Linked kNowledgebase
- **University of North Dakota**: Computational Biology & Bioinformatics
- **University of Michigan**: Medical School & School of Information

## License

This project is released under the [MIT License](LICENSE).

Vignet data is derived from publicly available PubMed abstracts and ontology resources. Data is provided as-is for research and educational purposes.

## Team & Acknowledgments

**Authors**:
- Junguk Hur, Ph.D. — University of North Dakota
- Yongqun "Oliver" He, Ph.D. — University of Michigan

**Database Development**:
- PubMed text mining with SciMiner
- BioBERT model training and deployment
- Vaccine Ontology curation and integration

**Acknowledgments**: See [Full Acknowledgments](https://ignet.org/vignet/acknowledgments/)

## Support

- **Website**: https://ignet.org/vignet/
- **FAQs**: https://ignet.org/vignet/faqs/
- **Contact**: [hurlabshared@gmail.com](mailto:hurlabshared@gmail.com) · https://ignet.org/vignet/contact/
- **Report Issues**: https://github.com/hurlab/Vignet/issues

---

**Last Updated**: April 14, 2026
**Version**: 1.0.1
**Copyright** © 2025–2026 Vignet. Developed by Hur Lab (UND) & He Lab (UM).
