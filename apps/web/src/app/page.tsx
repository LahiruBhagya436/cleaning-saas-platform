import Link from 'next/link'
import { ArrowRight, Star, Shield, Clock, Leaf, ChevronRight, Check } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { RutCalculator } from '@/components/shared/RutCalculator'
import { ServiceCard } from '@/components/shared/ServiceCard'

// Services data (will be fetched from API in production)
const SERVICES = [
  { name: 'Hemstädning',    nameSv: 'Regular home cleaning', price: 700, rutEligible: true,  minHours: 2, icon: '🏠', popular: true },
  { name: 'Storstädning',   nameSv: 'Deep cleaning',         price: 700, rutEligible: true,  minHours: 4, icon: '✨', popular: false },
  { name: 'Flyttstädning',  nameSv: 'Move-in / move-out',    price: 700, rutEligible: true,  minHours: 5, icon: '📦', popular: false },
  { name: 'Fönsterputning', nameSv: 'Window cleaning',       price: 600, rutEligible: true,  minHours: 1, icon: '🪟', popular: false },
  { name: 'Kontorstädning', nameSv: 'Office cleaning',       price: 650, rutEligible: false, minHours: 2, icon: '🏢', popular: false },
  { name: 'Byggstädning',   nameSv: 'Post-construction',     price: 800, rutEligible: false, minHours: 4, icon: '🔨', popular: false },
]

const REVIEWS = [
  { name: 'Anna L.',    area: 'Östermalm', rating: 5, text: 'Fantastisk service! Lägenheten var skinande ren. Kommer definitivt boka igen.' },
  { name: 'Marcus E.',  area: 'Vasastan',  rating: 5, text: 'Professionellt och pålitligt. RUT-avdraget gör det väldigt prisvärt.' },
  { name: 'Sofia K.',   area: 'Lidingö',   rating: 5, text: 'Samma städare varje gång, det uppskattar jag verkligen. Rekommenderar starkt!' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-50 opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-teal-50 opacity-40" />
        </div>

        <div className="container-tight relative section-pad">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">

            {/* Left — copy */}
            <div className="animate-fade-up">
              {/* RUT badge */}
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                RUT-avdrag — du betalar bara hälften av arbetskostnaden
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-neutral-900 leading-tight mb-6">
                Professionell<br />
                <span className="text-brand-600">städning</span> i<br />
                Stockholm
              </h1>

              <p className="text-lg text-neutral-600 leading-relaxed mb-8 max-w-lg">
                Boka en städning på 60 sekunder. Vi tar hand om resten —
                noggrant, pålitligt och med RUT-avdrag som gör det prisvärt för alla.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Button size="lg" asChild className="group">
                  <Link href="/book">
                    Boka städning nu
                    <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">Se priser med RUT</Link>
                </Button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-5 text-sm text-neutral-500">
                {[
                  { icon: Shield, text: 'Ansvarsförsäkrat' },
                  { icon: Star,   text: '4.9 / 5 i betyg' },
                  { icon: Clock,  text: 'Boka om 60 sek' },
                  { icon: Leaf,   text: 'Miljövänliga medel' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon size={14} className="text-brand-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — RUT calculator */}
            <div className="animate-fade-up delay-200">
              <RutCalculator />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="section-pad bg-neutral-50">
        <div className="container-tight">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-3">
              Så enkelt fungerar det
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Från bokning till skinande rent hem — utan krångel.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: '1', title: 'Välj tjänst & datum', desc: 'Välj vilken typ av städning du behöver och ett datum som passar dig. Realtidstillgänglighet visas direkt.' },
              { step: '2', title: 'Vi tar hand om resten', desc: 'En bakgrundskontrollerad städare anländer i tid. RUT-avdraget beräknas automatiskt — du betalar bara hälften.' },
              { step: '3', title: 'Betala & betygsätt', desc: 'Fakturan skickas automatiskt med Skatteverket-godkänt RUT-avdrag. Betygsätt din städare efter besöket.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative bg-white rounded-xl border border-neutral-200 p-6 shadow-card">
                <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-display text-lg mb-4">
                  {step}
                </div>
                <h3 className="font-sans font-medium text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
                {step !== '3' && (
                  <ChevronRight size={16} className="absolute -right-2.5 top-1/2 -translate-y-1/2 text-neutral-300 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ──────────────────────────────────────────────────────── */}
      <section className="section-pad bg-white">
        <div className="container-tight">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-2">
                Våra tjänster
              </h2>
              <p className="text-neutral-500">Priser inkl. 25% moms. RUT-berättigade tjänster markerade.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/services">
                Se alla <ArrowRight size={14} />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RUT EXPLAINER ─────────────────────────────────────────────────── */}
      <section className="section-pad bg-teal-600 text-white">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500 text-teal-100 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                Skatteförmån
              </div>
              <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
                Vad är RUT-avdrag?
              </h2>
              <p className="text-teal-100 leading-relaxed mb-6">
                RUT-avdrag är en svensk skatteförmån som ger dig 50% rabatt på
                arbetskostnaden för hushållstjänster — upp till 75 000 kr per person och år.
                Vi hanterar allt papperarbete med Skatteverket åt dig.
              </p>
              <ul className="space-y-3">
                {[
                  'Du betalar bara halva arbetskostnaden direkt till oss',
                  'Vi skickar RUT-ansökan automatiskt till Skatteverket',
                  'Skatteverket betalar den andra hälften direkt till oss',
                  'Gäller alla som betalar skatt i Sverige',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-teal-50">
                    <Check size={16} className="mt-0.5 shrink-0 text-teal-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-teal-500/40 rounded-2xl p-8 border border-teal-400/40">
              <p className="text-sm text-teal-200 mb-6">Exempel: Hemstädning 2 timmar</p>
              {[
                { label: 'Arbetskostnad',       value: '1 750 kr',   sub: '700 kr/tim × 2.5 tim' },
                { label: 'Moms (25%)',           value: '+ 438 kr',   sub: '' },
                { label: 'Totalt',               value: '2 188 kr',   sub: 'Utan RUT' },
                { label: 'RUT-avdrag (−50%)',    value: '− 1 094 kr', sub: 'Skatteverket betalar', highlight: true },
              ].map(({ label, value, sub, highlight }) => (
                <div key={label} className={`flex items-center justify-between py-2.5 ${highlight ? 'border-t border-teal-400/40 mt-2 pt-4' : ''}`}>
                  <div>
                    <p className={`text-sm font-medium ${highlight ? 'text-teal-200' : 'text-teal-100'}`}>{label}</p>
                    {sub && <p className="text-xs text-teal-300">{sub}</p>}
                  </div>
                  <p className={`font-display text-lg ${highlight ? 'text-teal-300' : 'text-white'}`}>{value}</p>
                </div>
              ))}
              <div className="border-t border-teal-400/40 mt-4 pt-4 flex items-center justify-between">
                <p className="font-medium text-white">Du betalar</p>
                <p className="font-display text-3xl text-white">1 094 kr</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────────────────── */}
      <section className="section-pad bg-neutral-50">
        <div className="container-tight">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl text-neutral-900 mb-2">
              Vad våra kunder säger
            </h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-sm text-neutral-500">4.9 av 5 (200+ recensioner)</span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-card">
                <div className="flex mb-3">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-medium">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{r.name}</p>
                    <p className="text-xs text-neutral-400">{r.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Redo för ett renare hem?
          </h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Boka din första städning idag. Ingen bindningstid. Avboka gratis upp till 24 timmar i förväg.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="teal" asChild className="group">
              <Link href="/book">
                Boka nu — från 175 kr/tim med RUT
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="bg-transparent border-brand-400 text-white hover:bg-brand-500">
              <Link href="/services">Se alla tjänster</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
