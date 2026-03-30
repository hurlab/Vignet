# Vignet — Vaccine Gene Network

Vignet is a web application for exploring vaccine-gene associations from biomedical literature. It is a sister site to [Ignet](https://github.com/hurlab/Ignet) and shares the same backend API and database.

**Live site:** https://ignet.org/vignet/

## Features

- **Explore** — Browse vaccines by VO (Vaccine Ontology) ID with mention counts and PMID statistics
- **Vaccine Profile** — Detailed view of a vaccine including top associated genes and sentence-level evidence
- **VacNet** — Interactive network visualization of vaccine-gene and gene-gene associations (Cytoscape.js)
- **VO Hierarchy** — Navigable Vaccine Ontology tree with gene data indicators

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Shared with Ignet — Flask API on port 9637 (`/api/v1/vaccine/*` endpoints)
- **Database:** Shared `ignet` database on MariaDB (schema at [hurlab/Ignet](https://github.com/hurlab/Ignet) `scripts/schema_ignet.sql`)
- **Visualization:** Cytoscape.js for network graphs

## Database

Vignet does not have its own database. It uses the `ignet` database, primarily these tables:

| Table | Description |
|-------|-------------|
| `t_vo` | Vaccine Ontology mentions from SciMiner (586K rows) |
| `t_vo_hierarchy` | VO ontology tree structure (6.8K nodes) |
| `t_vo_has_gene_data` | Precomputed lookup: which VOs have gene associations |
| `t_gene_pairs` | Gene-gene co-occurrence pairs with BioBERT scores (5.1M rows) |
| `vo_sciminer_187_terms` | Legacy VO mentions (fallback source) |

The full database schema is maintained in the Ignet repository:
**[hurlab/Ignet — scripts/schema_ignet.sql](https://github.com/hurlab/Ignet)**

## Development

```bash
cd frontend
npm install
npm run dev       # Dev server on http://localhost:5174
npm run build     # Build to ../dist-react/
```

## Related Repositories

- [hurlab/Ignet](https://github.com/hurlab/Ignet) — Ignet 2.0 (React SPA + Flask API + database schema)
- [hurlab/Ignet-Legacy](https://github.com/hurlab/Ignet-Legacy) — Original PHP-based Ignet

## License

Copyright (c) Hur Lab, University of North Dakota
