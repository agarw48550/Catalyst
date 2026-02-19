'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw error
      if (data.session) {
        window.location.href = '/dashboard'
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Get started with your AI-powered career journey</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <div className="p-4 bg-green-50 text-green-800 rounded-md">
                  <p className="font-medium">Check your email!</p>
                  <p className="text-sm mt-1">We&apos;ve sent a verification link to <strong>{email}</strong>. Click the link to activate your account.</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive it? Check your spam folder or{' '}
                  <button onClick={() => setSuccess(false)} className="text-primary hover:underline">try again</button>.
                </p>
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
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogle}>
                      Google
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground text-center w-full">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
