'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

function CallbackHandler() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading')
    const [message, setMessage] = useState('Completing sign-in…')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        const code = searchParams.get('code')
        const type = searchParams.get('type')
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const supabase = getSupabaseBrowserClient()

        async function handleCallback() {
            try {
                // Handle error parameters from Supabase redirects
                if (errorParam) {
                    throw new Error(errorDescription || errorParam)
                }

                // PKCE flow: exchange code for session
                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (error) throw error
                }

                // Check if this is an email verification callback
                const isEmailVerification = type === 'signup' || type === 'email' || type === 'magiclink'

                // Check for existing session (may have been set by hash fragment auto-detection)
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    if (isEmailVerification) {
                        setStatus('verified')
                        setMessage('Email verified successfully!')
                        setTimeout(() => {
                            window.location.href = '/dashboard'
                        }, 1500)
                    } else {
                        // Hard navigation to ensure middleware picks up cookies
                        window.location.href = '/dashboard'
                    }
                    return
                }

                // No session yet — wait for auth state change (handles hash fragment tokens)
                const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
                    if (session) {
                        subscription.unsubscribe()
                        if (isEmailVerification) {
                            setStatus('verified')
                            setMessage('Email verified successfully!')
                            setTimeout(() => {
                                window.location.href = '/dashboard'
                            }, 1500)
                        } else {
                            window.location.href = '/dashboard'
                        }
                    }
                })

                // Timeout after 8 seconds
                setTimeout(() => {
                    subscription.unsubscribe()
                    setStatus('error')
                    setErrorMsg('Authentication timed out. Please try signing in again.')
                }, 8000)
            } catch (err: any) {
                setStatus('error')
                setErrorMsg(err.message || 'Authentication failed')
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
            <div className="text-center space-y-4 max-w-md">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                        <p className="text-muted-foreground text-lg">{message}</p>
                    </>
                )}
                {status === 'verified' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-green-700">{message}</h2>
                        <p className="text-muted-foreground mt-2">Redirecting to dashboard…</p>
                    </div>
                )}
                {status === 'error' && (
                    <div className="animate-in fade-in duration-300">
                        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <p className="text-destructive text-lg">{errorMsg}</p>
                        <a href="/auth/login" className="text-primary hover:underline mt-4 inline-block font-medium">
                            Back to Login
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    )
}
