import { config } from '@/config'

export interface SearchResult {
  title: string
  url: string
  content: string
}

export async function searchTavily(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = config.search.tavilyApiKey
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured')
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: maxResults,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Tavily search failed (${response.status}): ${text}`)
  }

  const data = await response.json()
  const results = Array.isArray(data.results) ? data.results : []

  return results.map((item: { title?: string; url?: string; content?: string }) => ({
    title: item.title || 'Untitled',
    url: item.url || '',
    content: item.content || '',
  }))
}
