'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <button className="p-2 rounded-full border border-border/50 text-muted-foreground" aria-label="Toggle theme">
                <Monitor className="h-4 w-4" />
            </button>
        )
    }

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark')
        else if (theme === 'dark') setTheme('system')
        else setTheme('light')
    }

    return (
        <button
            onClick={cycleTheme}
            className="p-2 rounded-full border border-border/50 hover:bg-accent transition-colors"
            aria-label={`Current theme: ${theme}. Click to change.`}
            title={`Theme: ${theme}`}
        >
            {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
            ) : theme === 'light' ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Monitor className="h-4 w-4" />
            )}
        </button>
    )
}
