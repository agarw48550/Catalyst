'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Globe } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { translations, type Language, type TranslationKey } from './translations'

interface LanguageContextType {
    lang: Language
    setLang: (lang: Language) => void
    t: (key: TranslationKey) => string
}

export const LANG_CYCLE: Language[] = ['en', 'hi', 'mr', 'or']
export const LANG_LABELS: Record<Language, string> = {
    en: 'English',
    hi: 'हिंदी',
    mr: 'मराठी',
    or: 'ଓଡ଼ିଆ',
}
const LANG_SHORT: Record<Language, string> = {
    en: 'EN',
    hi: 'हि',
    mr: 'मरा',
    or: 'ଓଡ',
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'en',
    setLang: () => { },
    t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>('en')

    useEffect(() => {
        const saved = localStorage.getItem('catalyst-lang') as Language | null
        if (saved && LANG_CYCLE.includes(saved)) {
            setLangState(saved)
        }
    }, [])

    const setLang = useCallback((newLang: Language) => {
        setLangState(newLang)
        localStorage.setItem('catalyst-lang', newLang)
        document.documentElement.lang = newLang
    }, [])

    const t = useCallback((key: TranslationKey): string => {
        return translations[lang][key] || translations.en[key] || key
    }, [lang])

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    return useContext(LanguageContext)
}

export function LanguageToggle() {
    const { lang, setLang } = useLanguage()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <button
                className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                aria-label="Change language"
            >
                <Globe className="h-3.5 w-3.5" />
                <span>{LANG_SHORT.en}</span>
            </button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                    aria-label={`Language: ${LANG_LABELS[lang]}. Click to change.`}
                >
                    <Globe className="h-3.5 w-3.5" />
                    <span>{LANG_SHORT[lang]}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {LANG_CYCLE.map((code) => (
                    <DropdownMenuItem key={code} active={code === lang} onSelect={() => setLang(code)}>
                        {LANG_LABELS[code]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
