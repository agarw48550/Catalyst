'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export default function ResetPasswordPage() {
    const { t } = useLanguage()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/auth/update-password',
            })
            if (error) throw error
            setSuccess(true)
        } catch (err: any) {
            setError(err.message || 'Action failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
            <div className="w-full max-w-md">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    {t('auth.backHome')}
                </Link>
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">{t('auth.reset.title')}</CardTitle>
                        <CardDescription>{t('auth.reset.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                                <div className="p-4 bg-green-50 text-green-800 rounded-2xl">
                                    <p className="font-bold">{t('auth.reset.success')}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('auth.email')}</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                className="pl-10"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
                                        {loading ? t('auth.login.loading') : t('auth.reset.send')}
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Link href="/auth/login" className="text-sm text-primary hover:underline font-medium text-center w-full">
                            {t('auth.signup.signIn')}
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
