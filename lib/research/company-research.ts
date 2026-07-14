import { generateGeminiOnly, RESUME_MODEL_CANDIDATES } from '@/lib/ai/gemini'
import { searchTavily } from '@/lib/search/tavily'
import { searchDuckDuckGo } from '@/lib/search/duckduckgo'

export interface CompanyResearch {
  summary: string
  hiringProcess: string
  interviewTips: string[]
  cultureNotes: string
  sources: Array<{ title: string; url: string }>
}

async function runSearchQueries(company: string, jobTitle: string): Promise<Array<{ query: string; results: Awaited<ReturnType<typeof searchTavily>> }>> {
  const queries = [
    `${company} interview process hiring`,
    `${company} company culture work environment`,
    `${company} ${jobTitle} interview questions`,
  ]

  const allResults: Array<{ query: string; results: Awaited<ReturnType<typeof searchTavily>> }> = []

  for (const query of queries) {
    try {
      const results = await searchTavily(query, 3)
      allResults.push({ query, results })
    } catch {
      try {
        const results = await searchDuckDuckGo(query, 3)
        allResults.push({ query, results })
      } catch {
        allResults.push({ query, results: [] })
      }
    }
  }

  return allResults
}

function cleanAIResponse(text: string): string {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  return cleaned
}

export async function researchCompany(company: string, jobTitle: string, jobDescription: string): Promise<CompanyResearch> {
  const searchData = await runSearchQueries(company, jobTitle)

  const searchContext = searchData
    .map(({ query, results }) => {
      const snippets = results
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
        .join('\n\n')
      return `Query: ${query}\n${snippets || 'No results found.'}`
    })
    .join('\n\n---\n\n')

  const prompt = `You are a career research analyst. Synthesize web search results about a company to help a job candidate prepare for interviews.

COMPANY: ${company}
JOB TITLE: ${jobTitle}
JOB DESCRIPTION (excerpt):
${jobDescription.slice(0, 2000)}

WEB SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON with this structure:
{
  "summary": "2-3 sentence overview of the company and what they look for in candidates",
  "hiringProcess": "Description of typical hiring/interview process at this company",
  "interviewTips": ["tip1", "tip2", "tip3"],
  "cultureNotes": "Notes about company culture and values relevant to interviews",
  "sources": [{"title": "source title", "url": "https://..."}]
}

Base your answer on the search results. If information is limited, note that and provide general industry-relevant guidance.`

  const result = await generateGeminiOnly({ prompt, maxTokens: 4096, modelCandidates: [...RESUME_MODEL_CANDIDATES] })
  const cleaned = cleanAIResponse(result.text)

  try {
    return JSON.parse(cleaned) as CompanyResearch
  } catch {
    return {
      summary: `Research gathered for ${company}. Some details may be limited.`,
      hiringProcess: 'Standard multi-round interview process typical for this role.',
      interviewTips: [
        'Research the company mission and recent news',
        'Prepare STAR-format examples for behavioral questions',
        'Review the job description and match your experience',
      ],
      cultureNotes: searchContext.slice(0, 500) || 'No detailed culture information found.',
      sources: searchData.flatMap(({ results }) =>
        results.map((r) => ({ title: r.title, url: r.url }))
      ).slice(0, 5),
    }
  }
}
