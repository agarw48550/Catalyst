'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingBar } from '@/components/ui/loading-bar'
import { TrendingUp, Building2, DollarSign, Map, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { useLanguage } from '@/lib/i18n/context'

interface ResearchResult { query: string; type: string; response: string; timestamp: string }

const STORAGE_KEY = 'catalyst_research_history'

const quickActions = [
  { label: 'Research a company', type: 'company', icon: Building2, placeholder: 'e.g. TCS, Infosys, Wipro' },
  { label: 'Industry trends', type: 'industry', icon: TrendingUp, placeholder: 'e.g. IT sector in India 2024' },
  { label: 'Salary insights', type: 'salary', icon: DollarSign, placeholder: 'e.g. Software Engineer salary India' },
  { label: 'Career path advice', type: 'career-path', icon: Map, placeholder: 'e.g. Become a data scientist' },
]

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: string[] = []

  function flushList() {
    if (listItems.length > 0) {
      elements.push(<ul key={'ul-' + elements.length} className="list-disc list-inside space-y-1 my-2">{listItems.map((li, j) => <li key={j} className="text-sm dark:text-slate-200">{formatInline(li)}</li>)}</ul>)
      listItems = []
    }
    inList = false
  }

  function formatInline(s: string): React.ReactNode {
    const parts = s.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
      return p
    })
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('### ')) { flushList(); elements.push(<h4 key={i} className="text-sm font-bold mt-4 mb-1 dark:text-white">{formatInline(line.slice(4))}</h4>) }
    else if (line.startsWith('## ')) { flushList(); elements.push(<h3 key={i} className="text-base font-bold mt-4 mb-1 dark:text-white">{formatInline(line.slice(3))}</h3>) }
    else if (line.startsWith('# ')) { flushList(); elements.push(<h2 key={i} className="text-lg font-bold mt-4 mb-2 dark:text-white">{formatInline(line.slice(2))}</h2>) }
    else if (/^[-*]\s/.test(line)) { inList = true; listItems.push(line.replace(/^[-*]\s/, '')) }
    else if (/^\d+\.\s/.test(line)) { inList = true; listItems.push(line.replace(/^\d+\.\s/, '')) }
    else if (line.trim() === '') { flushList(); elements.push(<div key={i} className="h-2" />) }
    else { flushList(); elements.push(<p key={i} className="text-sm text-muted-foreground leading-relaxed my-1">{formatInline(line)}</p>) }
  }
  flushList()
  return elements
}

export default function ResearchPage() {
  const { lang: language } = useLanguage()
  const lang = (language || 'en') as 'en' | 'hi' | 'mr'
  const t = (en: string, hi: string, mr?: string) => lang === 'hi' ? hi : lang === 'mr' ? (mr || hi) : en

  const [query, setQuery] = useState('')
  const [type, setType] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ResearchResult[]>([])
  const [showArchive, setShowArchive] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { setHistory([]) }
  }, [])

  function saveHistory(h: ResearchResult[]) {
    setHistory(h)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 50))) } catch {}
  }

  async function handleSearch(sq: string, st: string) {
    if (!sq.trim()) return
    setLoading(true); setError(null); setExpandedIndex(null)
    try {
      const res = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sq, type: st }) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Research failed') }
      const data = await res.json()
      const entry: ResearchResult = { query: sq, type: st, response: data.response, timestamp: new Date().toISOString() }
      saveHistory([entry, ...history])
      setExpandedIndex(0)
      const c = parseInt(localStorage.getItem('catalyst_research_count') || '0', 10)
      localStorage.setItem('catalyst_research_count', (c + 1).toString())
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function handleQuickAction(a: typeof quickActions[0]) { setType(a.type); setQuery(a.placeholder.replace(/^e\.g\.\s*/i, '')) }
  async function handleFormSubmit(e: React.FormEvent) { e.preventDefault(); await handleSearch(query, type) }
  function deleteEntry(i: number) { saveHistory(history.filter((_, idx) => idx !== i)); if (expandedIndex === i) setExpandedIndex(null) }
  function clearAll() { saveHistory([]); setExpandedIndex(null) }

  const typeLabels: Record<string, string> = { company: 'Company', industry: 'Industry', salary: 'Salary', 'career-path': 'Career Path', general: 'General' }
  const typeColors: Record<string, string> = { company: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', industry: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', salary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', 'career-path': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', general: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' }

  const archivedResults = history.length > 1 ? history.slice(1) : []

  return (
    <>
      <AppHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t('Career Research', '\u0915\u0948\u0930\u093f\u092f\u0930 \u0930\u093f\u0938\u0930\u094d\u091a', '\u0915\u0930\u093f\u0905\u0930 \u0938\u0902\u0936\u094b\u0927\u0928')}</h1>
          <p className="text-muted-foreground">{t('Get AI-powered insights on industries and careers', 'AI \u0938\u0947 \u0909\u0926\u094d\u092f\u094b\u0917\u094b\u0902 \u0914\u0930 \u0915\u0948\u0930\u093f\u092f\u0930 \u092a\u0930 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u092a\u093e\u090f\u0902')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {quickActions.map((a) => (
            <Button key={a.type} variant={type === a.type ? 'default' : 'outline'} className="h-auto flex-col py-3 gap-1" onClick={() => handleQuickAction(a)} disabled={loading}>
              <a.icon className="h-5 w-5" /><span className="text-xs text-center">{a.label}</span>
            </Button>
          ))}
        </div>

        <Card className="mb-6 dark:bg-slate-900/50">
          <CardContent className="pt-4">
            <form onSubmit={handleFormSubmit} className="flex gap-3">
              <Input placeholder={quickActions.find(a => a.type === type)?.placeholder || 'Ask anything...'} value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
              <Button type="submit" disabled={loading || !query.trim()}>
                {loading ? t('Researching...', '\u0930\u093f\u0938\u0930\u094d\u091a \u0939\u094b \u0930\u0939\u0940 \u0939\u0948...') : t('Research', '\u0930\u093f\u0938\u0930\u094d\u091a', '\u0938\u0902\u0936\u094b\u0927\u0928')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
        {loading && <LoadingBar active={loading} estimatedTime={15} label={t('Researching...', '\u0930\u093f\u0938\u0930\u094d\u091a \u0939\u094b \u0930\u0939\u0940 \u0939\u0948...')} />}

        {history.length > 0 && !loading && (
          <div className="space-y-4">
            <Card className="border-primary/20 shadow-md dark:bg-slate-900/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                      {history[0].query}
                      <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full ' + (typeColors[history[0].type] || typeColors.general)}>{typeLabels[history[0].type] || history[0].type}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(history[0].timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteEntry(0)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose-sm">{renderMarkdown(history[0].response)}</div>
              </CardContent>
            </Card>

            {archivedResults.length > 0 && (
              <div>
                <button onClick={() => setShowArchive(!showArchive)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
                  <Clock className="h-4 w-4" /> {t('Previous Queries', '\u092a\u093f\u091b\u0932\u0947 \u092a\u094d\u0930\u0936\u094d\u0928')} ({archivedResults.length})
                  {showArchive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showArchive && (
                  <div className="space-y-3">
                    <div className="flex justify-end"><Button size="sm" variant="ghost" onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3 mr-1" /> {t('Clear All', '\u0938\u092c \u0939\u091f\u093e\u090f\u0902')}</Button></div>
                    {archivedResults.map((item, i) => {
                      const ri = i + 1
                      const isExp = expandedIndex === ri
                      return (
                        <Card key={item.timestamp + i} className="border-border/50 dark:bg-slate-900/50">
                          <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedIndex(isExp ? null : ri)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={'text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ' + (typeColors[item.type] || typeColors.general)}>{typeLabels[item.type] || item.type}</span>
                                <span className="text-sm font-medium truncate dark:text-white">{item.query}</span>
                                <span className="text-xs text-muted-foreground shrink-0">{new Date(item.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteEntry(ri) }} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                                {isExp ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CardHeader>
                          {isExp && <CardContent><div className="prose-sm">{renderMarkdown(item.response)}</div></CardContent>}
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
            <p>{t('Use quick actions or type a query to get started', '\u0924\u094d\u0935\u0930\u093f\u0924 \u0915\u094d\u0930\u093f\u092f\u093e\u0913\u0902 \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902 \u092f\u093e \u092a\u094d\u0930\u0936\u094d\u0928 \u091f\u093e\u0907\u092a \u0915\u0930\u0947\u0902')}</p>
          </div>
        )}
      </div>
    </>
  )
}
