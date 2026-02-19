'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TrendingUp, Building2, DollarSign, Map } from 'lucide-react'
import { AppHeader } from '@/components/app-header'

interface ResearchResult {
  query: string
  type: string
  response: string
}

const quickActions = [
  { label: 'Research a company', type: 'company', icon: Building2, placeholder: 'e.g. TCS, Infosys, Wipro' },
  { label: 'Industry trends', type: 'industry', icon: TrendingUp, placeholder: 'e.g. IT sector in India 2024' },
  { label: 'Salary insights', type: 'salary', icon: DollarSign, placeholder: 'e.g. Software Engineer salary India' },
  { label: 'Career path advice', type: 'career-path', icon: Map, placeholder: 'e.g. Become a data scientist' },
]

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ResearchResult[]>([])

  async function handleSearch(searchQuery: string, searchType: string) {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, type: searchType }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Research failed')
      }
      const data = await res.json()
      setHistory((prev) => [{ query: searchQuery, type: searchType, response: data.response }, ...prev])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleQuickAction(action: typeof quickActions[0]) {
    setType(action.type)
    setQuery(action.placeholder.replace(/^e\.g\.\s*/i, ''))
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    await handleSearch(query, type)
  }

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Career Research</h1>
          <p className="text-muted-foreground">Get AI-powered insights on industries, companies, and career paths</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {quickActions.map((action) => (
            <Button
              key={action.type}
              variant={type === action.type ? 'default' : 'outline'}
              className="h-auto flex-col py-3 gap-1"
              onClick={() => handleQuickAction(action)}
              disabled={loading}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs text-center">{action.label}</span>
            </Button>
          ))}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <form onSubmit={handleFormSubmit} className="flex gap-3">
              <Input
                placeholder={quickActions.find((a) => a.type === type)?.placeholder || 'Ask anything about careers, companies, salaries...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? 'Researching...' : 'Research'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
        )}

        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Researching...</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {history.map((item, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-base">
                  {item.query}
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {item.type}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.response}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {history.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Use quick actions above or type a custom query to get started</p>
          </div>
        )}
      </div>
    </>
  )
}
