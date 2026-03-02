'use client'

import { useEffect, useState } from 'react'

interface LoadingBarProps {
  /** Whether the loading bar is active */
  active: boolean
  /** Estimated time in seconds (used to pace the bar) */
  estimatedTime?: number
  /** Text to show below the bar */
  label?: string
}

/**
 * Animated indeterminate loading bar with estimated progress simulation.
 * Accelerates to ~90% over `estimatedTime`, then crawls until complete.
 */
export function LoadingBar({ active, estimatedTime = 15, label }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) {
      if (progress > 0) {
        // Snap to 100% briefly, then reset
        setProgress(100)
        const t = setTimeout(() => setProgress(0), 400)
        return () => clearTimeout(t)
      }
      return
    }

    setProgress(5)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev + 0.1
        // Ease-out curve: fast at start, slows near 90%
        const remaining = 90 - prev
        const step = Math.max(0.3, remaining * 0.08)
        return Math.min(95, prev + step)
      })
    }, (estimatedTime * 1000) / 60) // ~60 updates over the estimated time

    return () => clearInterval(interval)
  }, [active, estimatedTime])

  if (!active && progress === 0) return null

  return (
    <div className="w-full space-y-2">
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {label && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">{label}</p>
      )}
    </div>
  )
}
