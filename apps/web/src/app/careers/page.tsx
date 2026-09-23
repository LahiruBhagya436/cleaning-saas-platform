import { ArrowRight, Clock, Heart, TrendingUp, Wallet } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const PERKS = [
  { icon: Wallet, title: 'Competitive pay', desc: 'Fixed hourly pay plus bonus based on customer ratings.' },
  { icon: Clock, title: 'Flexible schedules', desc: 'Choose the shifts that suit your life — part-time or full-time.' },
  { icon: TrendingUp, title: 'Growth', desc: 'Training, certifications and the chance to become a team leader.' },
  { icon: Heart, title: 'Good work environment', desc: 'Insurance, equipment and a team that has your back.' },
]

const OPEN_ROLES = [
  { title: 'Cleaner — Stockholm City', type: 'Full-time / Part-time' },
  { title: 'Cleaner — Södermalm & south suburbs', type: 'Full-time / Part-time' },
  { title: 'Teamledare', type: 'Heltid' },
  { title: 'Customer service representative', type: 'Part-time' },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Arbeta hos oss</h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            We are growing and looking for more dedicated cleaners for our team in Stockholm.
            Good pay, flexible schedules and a team that cares.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-tight grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PERKS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <p.icon size={22} />
              </div>
              <h3 className="font-display text-lg text-neutral-900 mb-2">{p.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad bg-white border-y border-neutral-100">
        <div className="container-tight max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-neutral-900 mb-8 text-center">Open positions</h2>
          <div className="space-y-3">
            {OPEN_ROLES.map((role) => (
              <div
                key={role.title}
                className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl p-5"
              >
                <div>
                  <p className="font-medium text-neutral-900">{role.title}</p>
                  <p className="text-sm text-neutral-500">{role.type}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href="mailto:hej@cleaningco.se?subject=Job application">
                    Apply <ArrowRight size={14} />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-white mb-4">Hittar du ingen passande roll?</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Send an open application — we are growing all the time and always looking for great people.
          </p>
          <Button size="xl" variant="teal" asChild>
            <a href="mailto:hej@cleaningco.se?subject=Open application">
              Send open application <ArrowRight size={18} />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
