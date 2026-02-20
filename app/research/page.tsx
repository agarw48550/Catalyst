'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TrendingUp, Building2, DollarSign, Map, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { AppHeader } from '@/components/app-header'

interface ResearchResult {
  query: string
  type: string
  response: string
  timestamp: string
}

const STORAGE_KEY = 'catalyst_research_history'

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
  const [showArchive, setShowArchive] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setHistory(saved)
    } catch {
      setHistory([])
    }
  }, [])

  // Save to localStorage whenever history changes
  function saveHistory(newHistory: ResearchResult[]) {
    setHistory(newHistory)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory.slice(0, 50))) // Keep max 50
    } catch {}
  }

  async function handleSearch(searchQuery: string, searchType: string) {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    setExpandedIndex(null)
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
      const newEntry: ResearchResult = {
        query: searchQuery,
        type: searchType,
        response: data.response,
        timestamp: new Date().toISOString(),
      }
      const newHistory = [newEntry, ...history]
      saveHistory(newHistory)
      setExpandedIndex(0)

      // Track usage count
      const count = parseInt(localStorage.getItem('catalyst_research_count') || '0', 10)
      localStorage.setItem('catalyst_research_count', (count + 1).toString())
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

  function deleteEntry(index: number) {
    const newHistory = history.filter((_, i) => i !== index)
    saveHistory(newHistory)
    if (expandedIndex === index) setExpandedIndex(null)
  }

  function clearAllHistory() {
    saveHistory([])
    setExpandedIndex(null)
  }

  const typeLabels: Record<string, string> = {
    company: 'Company',
    industry: 'Industry',
    salary: 'Salary',
    'career-path': 'Career Path',
    general: 'General',
  }

  const typeColors: Record<string, string> = {
    company: 'bg-blue-100 text-blue-700',
    industry: 'bg-emerald-100 text-emerald-700',
    salary: 'bg-amber-100 text-amber-700',
    'career-path': 'bg-violet-100 text-violet-700',
    general: 'bg-slate-100 text-slate-700',
  }

  // Split history: latest result vs archive
  const latestResult = history.length > 0 && expandedIndex === 0 ? history[0] : null
  const archivedResults = history.length > 1 ? history.slice(1) : []

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
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Researching...</p>
                <p className="text-xs mt-1">This may take 10-20 seconds</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Latest Result */}
        {history.length > 0 && !loading && (
          <div className="space-y-4">
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {history[0].query}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[history[0].type] || typeColors.general}`}>
                        {typeLabels[history[0].type] || history[0].type}
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(history[0].timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteEntry(0)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {history[0].response}
                </div>
              </CardContent>
            </Card>

            {/* Archived Queries */}
            {archivedResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <Clock className="h-4 w-4" />
                  Previous Queries ({archivedResults.length})
                  {showArchive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {showArchive && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={clearAllHistory} className="text-xs text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3 mr-1" /> Clear All
                      </Button>
                    </div>
                    {archivedResults.map((item, i) => {
                      const realIndex = i + 1
                      const isExpanded = expandedIndex === realIndex
                      return (
                        <Card key={item.timestamp + i} className="border-border/50">
                          <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedIndex(isExpanded ? null : realIndex)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeColors[item.type] || typeColors.general}`}>
                                  {typeLabels[item.type] || item.type}
                                </span>
                                <span className="text-sm font-medium truncate">{item.query}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteEntry(realIndex) }} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent>
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {item.response}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
