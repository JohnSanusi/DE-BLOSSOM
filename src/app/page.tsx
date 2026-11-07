import Link from 'next/link';
import { ArrowRight, Shield, PiggyBank, Users, TrendingUp, Landmark, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-surface-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-900 flex items-center justify-center">
              <span className="text-white font-bold text-sm">DB</span>
            </div>
            <span className="text-lg font-bold text-brand-900">DE-BLOSSOM</span>
          </div>
          <Link href="/auth" className="btn-primary text-sm">
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 mb-6">
              <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-sm text-white/80">Trusted cooperative financial management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Grow Together with{' '}
              <span className="text-accent-400">DE-BLOSSOM</span>
            </h1>
            <p className="text-lg text-white/70 mt-6 max-w-2xl leading-relaxed">
              A modern platform for cooperative societies to manage member savings, contributions, loans, and financial records with transparency and trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link href="/auth" className="btn-accent px-8 py-3 text-base">
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/auth" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/5 px-8 py-3 text-base font-medium text-white hover:bg-white/10 transition-colors">
                Member Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-surface-900">
              Everything Your Cooperative Needs
            </h2>
            <p className="text-surface-500 mt-3 max-w-2xl mx-auto">
              Comprehensive financial management tools designed for transparency, accountability, and growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <PiggyBank className="h-6 w-6" />, title: 'Savings Management', desc: 'Track regular and special savings contributions with real-time balance updates.' },
              { icon: <Landmark className="h-6 w-6" />, title: 'Loan Processing', desc: 'Apply for loans, track applications, and manage repayments seamlessly.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Payment Verification', desc: 'Submit payment evidence and track administrator verification in real time.' },
              { icon: <TrendingUp className="h-6 w-6" />, title: 'Financial Reports', desc: 'Comprehensive reports and analytics for transparent cooperative management.' },
              { icon: <Users className="h-6 w-6" />, title: 'Member Management', desc: 'Complete member profiles, activity tracking, and account management.' },
              { icon: <CheckCircle className="h-6 w-6" />, title: 'Audit Trail', desc: 'Every financial action is recorded with full accountability and traceability.' },
            ].map((feature) => (
              <div key={feature.title} className="card p-6 hover:shadow-card-hover transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-surface-900">{feature.title}</h3>
                <p className="text-sm text-surface-500 mt-2 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-white/70 mt-3 text-lg">
            Join DE-BLOSSOM and experience modern cooperative financial management.
          </p>
          <Link href="/auth" className="btn-accent px-8 py-3 text-base mt-8 inline-flex">
            Create Your Account <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-surface-400">
            © {new Date().getFullYear()} DE-BLOSSOM Cooperative Society. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
