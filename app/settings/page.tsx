'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { AppHeader } from '@/components/app-header'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/lib/i18n/context'
import { Shield, Mail, Lock, User, Save, RefreshCw, Users, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [updatingEmail, setUpdatingEmail] = useState(false)
    const [updatingPassword, setUpdatingPassword] = useState(false)

    useEffect(() => {
        if (user?.email) setEmail(user.email)
    }, [user])

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    async function handleUpdateEmail() {
        setUpdatingEmail(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.updateUser({ email })
            if (error) throw error
            toast({
                title: "Check your email",
                description: "A confirmation link has been sent to your new email address.",
            })
        } catch (err: any) {
            toast({
                title: "Update failed",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setUpdatingEmail(false)
        }
    }

    async function handleUpdatePassword() {
        if (!password) return
        setUpdatingPassword(true)
        try {
            const supabase = getSupabaseBrowserClient()
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            toast({
                title: "Success",
                description: "Your password has been updated.",
            })
            setPassword('')
        } catch (err: any) {
            toast({
                title: "Update failed",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setUpdatingPassword(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-primary selection:text-white pb-20">
            <AppHeader />

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">{t('settings.title')}</h1>
                    <p className="text-slate-500 font-medium">{t('settings.subtitle')}</p>
                </div>

                <div className="grid gap-8">
                    {/* Profile Section */}
                    <Card className="border-0 shadow-sm overflow-hidden rounded-3xl group transition-all hover:shadow-xl hover:shadow-primary/5">
                        <CardHeader className="bg-white border-b border-slate-50 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black">{t('settings.profile.title')}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">{t('settings.email.label')}</Label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-4 top-[0.85rem] h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-12 h-14 rounded-2xl border-2 focus-visible:ring-primary/20 transition-all font-medium"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdateEmail}
                                        disabled={updatingEmail || email === user?.email}
                                        className="h-14 px-8 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        {updatingEmail ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                        {t('settings.email.update')}
                                    </Button>
                                </div>
                                <p className="text-xs text-slate-400 ml-1 font-medium italic">
                                    * Changing your email requires confirmation from both old and new addresses.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card className="border-0 shadow-sm overflow-hidden rounded-3xl group transition-all hover:shadow-xl hover:shadow-violet-500/5">
                        <CardHeader className="bg-white border-b border-slate-50 p-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-violet-100 text-violet-600 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black">{t('settings.account.title')}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">{t('settings.password.label')}</Label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-4 top-[0.85rem] h-5 w-5 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-12 h-14 rounded-2xl border-2 focus-visible:ring-violet-500/20 transition-all font-medium"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleUpdatePassword}
                                        disabled={updatingPassword || !password}
                                        variant="outline"
                                        className="h-14 px-8 rounded-2xl font-black text-lg border-2 hover:bg-slate-50 hover:border-violet-500/30 transition-all"
                                    >
                                        {updatingPassword ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Shield className="mr-2 h-5 w-5" />}
                                        {t('settings.password.update')}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invite Section */}
                    <InviteSection t={t} toast={toast} />
                </div>
            </main>
        </div>
    )
}

function InviteSection({ t, toast }: { t: any; toast: any }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleInvite() {
        if (!email) return
        setLoading(true)
        try {
            const supabase = getSupabaseBrowserClient()
            // Note: inviteUserByEmail is an admin method. In a typical client-side app, 
            // you might need a server action or edge function if bypass_rls is not set.
            // For this demo/setup, we'll try the standard auth invite.
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin + '/auth/signup',
                    data: { invited_by: 'user' }
                }
            })
            if (error) throw error
            toast({
                title: "Invite Sent",
                description: t('settings.invite.success'),
            })
            setEmail('')
        } catch (err: any) {
            toast({
                title: "Action failed",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-0 shadow-sm overflow-hidden rounded-3xl group transition-all hover:shadow-xl hover:shadow-orange-500/5">
            <CardHeader className="bg-white border-b border-slate-50 p-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-orange-100 text-orange-600 group-hover:scale-110 transition-transform">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black">{t('settings.invite.title')}</CardTitle>
                        <CardDescription className="font-medium">{t('settings.invite.subtitle')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="space-y-2">
                    <Label htmlFor="invite-email" className="text-sm font-bold text-slate-700 ml-1">{t('settings.email.label')}</Label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Mail className="absolute left-4 top-[0.85rem] h-5 w-5 text-muted-foreground" />
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="colleague@example.com"
                                className="pl-12 h-14 rounded-2xl border-2 focus-visible:ring-orange-500/20 transition-all font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleInvite}
                            disabled={loading || !email}
                            className="h-14 px-8 rounded-2xl font-black text-lg bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/20 hover:scale-105 transition-all"
                        >
                            {loading ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Users className="mr-2 h-5 w-5" />}
                            {t('settings.invite.button')}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
