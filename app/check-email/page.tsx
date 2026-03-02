'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'

function CheckEmailContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [resending, setResending] = useState(false)
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [resendMessage, setResendMessage] = useState('')

    async function handleResend() {
        if (!email) return
        setResending(true)
        setResendStatus('idle')
        try {
            const res = await fetch('/api/auth/resend-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) {
                setResendStatus('error')
                setResendMessage(data.error || 'Failed to resend')
            } else {
                setResendStatus('success')
                setResendMessage('Confirmation email resent! Check your inbox.')
            }
        } catch {
            setResendStatus('error')
            setResendMessage('Network error. Please try again.')
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
            <div className="w-full max-w-md">
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
                    <CardHeader className="text-center space-y-4 pb-2">
                        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-indigo-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <p className="text-muted-foreground">
                            We&apos;ve sent a verification link to
                        </p>
                        {email && (
                            <p className="font-semibold text-lg text-foreground break-all">
                                {email}
                            </p>
                        )}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 text-left space-y-2">
                            <p className="font-medium">Next steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Open your email inbox</li>
                                <li>Look for an email from Catalyst</li>
                                <li>Click the verification link</li>
                                <li>You&apos;ll be signed in automatically</li>
                            </ol>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            The link expires in <strong>24 hours</strong>. Check your spam/junk folder if you don&apos;t see it.
                        </p>

                        {/* Resend button */}
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={handleResend}
                                disabled={resending || !email}
                                className="w-full"
                                id="resend-confirmation-btn"
                            >
                                {resending ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Resending…
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Resend confirmation email
                                    </>
                                )}
                            </Button>
                        </div>

                        {resendStatus === 'success' && (
                            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-md text-sm">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                {resendMessage}
                            </div>
                        )}

                        {resendStatus === 'error' && (
                            <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm">
                                {resendMessage}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function CheckEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
                    <p className="text-muted-foreground">Loading…</p>
                </div>
            }
        >
            <CheckEmailContent />
        </Suspense>
    )
}
