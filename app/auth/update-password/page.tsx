'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Lock, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export default function UpdatePasswordPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.updateUser({
                password: password,
            })
            if (error) throw error
            setSuccess(true)
            setTimeout(() => {
                router.push('/dashboard')
                router.refresh()
            }, 2000)
        } catch (err: any) {
            setError(err.message || 'Update failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">{t('auth.updatePassword.title')}</CardTitle>
                        <CardDescription>{t('auth.updatePassword.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                                <div className="p-4 bg-green-50 text-green-800 rounded-2xl">
                                    <p className="font-bold">{t('auth.updatePassword.success')}</p>
                                    <p className="text-sm mt-1">{t('callback.redirecting')}</p>
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
                                        <Label htmlFor="password">{t('auth.password')}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirm-password"
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-10"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
                                        {loading ? t('auth.login.loading') : t('auth.updatePassword.submit')}
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
