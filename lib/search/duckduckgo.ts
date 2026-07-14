import type { SearchResult } from './tavily'

interface DuckDuckGoTopic {
  Text?: string
  FirstURL?: string
}

interface DuckDuckGoResponse {
  AbstractText?: string
  AbstractURL?: string
  Heading?: string
  RelatedTopics?: Array<DuckDuckGoTopic | { Topics?: DuckDuckGoTopic[] }>
}

function isDuckDuckGoTopic(topic: DuckDuckGoTopic | { Topics?: DuckDuckGoTopic[] }): topic is DuckDuckGoTopic {
  return 'Text' in topic && 'FirstURL' in topic
}

export async function searchDuckDuckGo(query: string, maxResults = 5): Promise<SearchResult[]> {
  const url = new URL('https://api.duckduckgo.com/')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('no_redirect', '1')
  url.searchParams.set('no_html', '1')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed (${response.status})`)
  }

  const data: DuckDuckGoResponse = await response.json()
  const results: SearchResult[] = []

  if (data.AbstractText) {
    results.push({
      title: data.Heading || query,
      url: data.AbstractURL || '',
      content: data.AbstractText,
    })
  }

  const topics = data.RelatedTopics || []
  for (const topic of topics) {
    if (results.length >= maxResults) break

    if ('Topics' in topic && Array.isArray(topic.Topics)) {
      for (const nested of topic.Topics) {
        if (results.length >= maxResults) break
        if (nested.Text && nested.FirstURL) {
          results.push({
            title: nested.Text.split(' - ')[0] || nested.Text,
            url: nested.FirstURL,
            content: nested.Text,
          })
        }
      }
    } else if (isDuckDuckGoTopic(topic)) {
      results.push({
        title: topic.Text!.split(' - ')[0] || topic.Text!,
        url: topic.FirstURL!,
        content: topic.Text!,
      })
    }
  }

  return results.slice(0, maxResults)
}
