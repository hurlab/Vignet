const BASE_URL = '/api/v1'

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || `HTTP ${res.status}`)
    }

    return res.json()
  } catch (e) {
    clearTimeout(timeoutId)
    if (e.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw e
  }
}

export const api = {
  get: (path) => request(path),

  vaccineStats: () => request('/vaccine/stats'),
  vaccineExplore: (q = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset })
    if (q) params.set('q', q)
    return request(`/vaccine/explore?${params}`)
  },
  vaccineProfile: (voId) => request(`/vaccine/${encodeURIComponent(voId)}`),
  vaccineSentences: (voId, limit = 20, offset = 0) =>
    request(`/vaccine/${encodeURIComponent(voId)}/sentences?limit=${limit}&offset=${offset}`),
  vaccineNetwork: (voId) => request(`/vaccine/network/${encodeURIComponent(voId)}`),
  vaccineTopGenes: () => request('/vaccine/top-genes'),
  vaccineHierarchy: (maxDepth = 10, dataOnly = true) => {
    const params = new URLSearchParams({ max_depth: maxDepth })
    if (dataOnly) params.set('data_only', 'true')
    return request(`/vaccine/hierarchy?${params}`)
  },
  vaccineNetworkMulti: (voIds, geneGene = false, crossEntity = false, implicit = false) => {
    const params = new URLSearchParams({ vo_ids: voIds.join(',') })
    if (geneGene) params.set('gene_gene', 'true')
    if (crossEntity) params.set('cross_entity', 'true')
    if (implicit) params.set('implicit', 'true')
    return request(`/vaccine/network?${params}`)
  },
}
