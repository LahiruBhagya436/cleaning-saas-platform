import { ArrowRight, Clock, Heart, TrendingUp, Wallet } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const PERKS = [
  { icon: Wallet, title: 'Konkurrenskraftig lön', desc: 'Fast timlön plus bonus baserat på kundbetyg.' },
  { icon: Clock, title: 'Flexibla scheman', desc: 'Välj de pass som passar ditt liv — deltid eller heltid.' },
  { icon: TrendingUp, title: 'Utveckling', desc: 'Utbildning, certifieringar och möjlighet att bli teamledare.' },
  { icon: Heart, title: 'Bra arbetsmiljö', desc: 'Försäkring, utrustning och ett team som har din rygg.' },
]

const OPEN_ROLES = [
  { title: 'Städare — Stockholm City', type: 'Heltid / Deltid' },
  { title: 'Städare — Södermalm & Söderort', type: 'Heltid / Deltid' },
  { title: 'Teamledare', type: 'Heltid' },
  { title: 'Kundtjänstmedarbetare', type: 'Deltid' },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Arbeta hos oss</h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            Vi växer och söker fler engagerade städare till vårt team i Stockholm.
            Bra lön, flexibla scheman och ett team som bryr sig.
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
          <h2 className="font-display text-3xl text-neutral-900 mb-8 text-center">Lediga tjänster</h2>
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
                  <a href="mailto:hej@cleaningco.se?subject=Jobbansökan">
                    Ansök <ArrowRight size={14} />
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
            Skicka in en spontanansökan — vi växer hela tiden och letar alltid efter bra människor.
          </p>
          <Button size="xl" variant="teal" asChild>
            <a href="mailto:hej@cleaningco.se?subject=Spontanansökan">
              Skicka spontanansökan <ArrowRight size={18} />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
