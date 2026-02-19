'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type Language, type TranslationKey } from './translations'

interface LanguageContextType {
    lang: Language
    setLang: (lang: Language) => void
    t: (key: TranslationKey) => string
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
        if (saved && (saved === 'en' || saved === 'hi')) {
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
    return (
        <button
            onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1 text-xs font-medium rounded-full border border-border/50 hover:bg-accent transition-colors"
            title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        >
            {lang === 'en' ? 'हिंदी' : 'EN'}
        </button>
    )
}
