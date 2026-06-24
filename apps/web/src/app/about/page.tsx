import Link from 'next/link'
import { ArrowRight, Check, Heart, Shield, Sparkles, Users } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const VALUES = [
  {
    icon: Heart,
    title: 'Omtanke',
    description: 'Vi behandlar ditt hem som om det var vårt eget — med respekt för dina saker och din integritet.',
  },
  {
    icon: Shield,
    title: 'Pålitlighet',
    description: 'Samma städare varje gång, bakgrundskontrollerad personal och full ansvarsförsäkring.',
  },
  {
    icon: Sparkles,
    title: 'Kvalitet',
    description: 'Vi följer en tydlig checklista vid varje städning så att resultatet alltid håller samma höga nivå.',
  },
  {
    icon: Users,
    title: 'Lokal närvaro',
    description: 'Ett Stockholmsbaserat team som känner stadens bostäder, föreningar och behov.',
  },
]

const STATS = [
  { value: '2 400+', label: 'Nöjda kunder' },
  { value: '15 000+', label: 'Genomförda städningar' },
  { value: '4,9/5', label: 'Snittbetyg' },
  { value: '8 år', label: 'I branschen' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">
            Om Stockholm Cleaning Co.
          </h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            Vi grundades med ett enkelt mål: göra professionell städning enkel, pålitlig
            och prisvärd för Stockholms hushåll och företag.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad">
        <div className="container-tight grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h2 className="font-display text-3xl text-neutral-900 mb-4">Vår historia</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Stockholm Cleaning Co. startade som en liten lokal verksamhet med målet att
              höja standarden på städtjänster i Stockholm. Vi var trötta på att höra om
              osäkra bokningar, oregelbunden kvalitet och städare som aldrig var de samma.
            </p>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Idag är vi ett av Stockholms mest betrodda städbolag — med ett team av
              utbildade, bakgrundskontrollerade städare och ett bokningssystem som gör det
              enkelt att boka, omboka och betala, helt digitalt.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Vi är godkända RUT-leverantörer, innehar F-skatt och är fullt
              ansvarsförsäkrade — så du kan känna dig trygg varje gång vi kommer hem till dig.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
                <p className="font-display text-3xl text-brand-600 mb-1">{stat.value}</p>
                <p className="text-sm text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad bg-white border-y border-neutral-100">
        <div className="container-tight">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl text-neutral-900 mb-3">Vad vi står för</h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Fyra principer som styr allt vi gör, från första bokning till sista detalj.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <value.icon size={22} />
                </div>
                <h3 className="font-display text-lg text-neutral-900 mb-2">{value.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust points */}
      <section className="section-pad">
        <div className="container-tight">
          <div className="bg-neutral-900 rounded-2xl p-8 sm:p-12 text-white">
            <h2 className="font-display text-2xl sm:text-3xl mb-6">Varför välja oss?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Godkänd RUT-leverantör — du betalar bara hälften',
                'Innehar F-skatt och full ansvarsförsäkring',
                'Bakgrundskontrollerad och utbildad personal',
                'Samma städare vid varje besök',
                'Nöjd-kund-garanti — vi rättar till om något missas',
                'Enkel digital bokning och betalning',
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm text-neutral-300">
                  <Check size={16} className="text-teal-400 mt-0.5 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-white mb-4">Redo att boka din städning?</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Det tar mindre än två minuter att boka — och du kan när som helst omboka eller avboka.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="teal" asChild>
              <Link href="/book">Boka nu <ArrowRight size={18} /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="bg-transparent border-brand-400 text-white hover:bg-brand-500">
              <Link href="/services">Se våra tjänster</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
