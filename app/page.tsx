import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Briefcase, FileText, MessageSquare, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Catalyst</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="text-sm hover:text-primary">About</Link>
            <Link href="/features" className="text-sm hover:text-primary">Features</Link>
            <Link href="/pricing" className="text-sm hover:text-primary">Pricing</Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your AI-Powered
            <br />
            <span className="text-primary">Career Companion</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your job search with intelligent resume building, AI-driven interview practice,
            and personalized job recommendations tailored for the Indian market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Succeed</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<FileText className="h-10 w-10 text-primary" />}
                title="Smart Resume Builder"
                description="Create ATS-optimized resumes with AI-powered suggestions and templates."
              />
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-primary" />}
                title="AI Interview Coach"
                description="Practice with our voice-enabled AI interviewer and get real-time feedback."
              />
              <FeatureCard
                icon={<Briefcase className="h-10 w-10 text-primary" />}
                title="Job Aggregation"
                description="Access thousands of jobs from NCS, Jooble, and Adzuna in one place."
              />
              <FeatureCard
                icon={<TrendingUp className="h-10 w-10 text-primary" />}
                title="Career Research"
                description="Get AI-powered insights on career trends, skills, and industry analysis."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of job seekers who have found success with Catalyst
          </p>
          <Link href="/auth/signup">
            <Button size="lg">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Catalyst</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering careers with AI technology
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
                <li><Link href="/demo" className="text-muted-foreground hover:text-primary">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary">About</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                <li><Link href="/careers" className="text-muted-foreground hover:text-primary">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Privacy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Catalyst (RozgarSathi). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-background p-6 rounded-lg border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
