import Link from 'next/link'
import { ArrowRight, Check, Heart, Shield, Sparkles, Users } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const VALUES = [
  {
    icon: Heart,
    title: 'Omtanke',
    description: 'We treat your home as if it were our own — with respect for your belongings and your privacy.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: 'The same cleaner every time, background-checked staff and full liability insurance.',
  },
  {
    icon: Sparkles,
    title: 'Kvalitet',
    description: 'We follow a clear checklist at every cleaning so the result is always the same high standard.',
  },
  {
    icon: Users,
    title: 'Local presence',
    description: 'A Stockholm-based team that knows the homes, housing associations and needs of the city.',
  },
]

const STATS = [
  { value: '2 400+', label: 'Satisfied customers' },
  { value: '15 000+', label: 'Cleanings completed' },
  { value: '4,9/5', label: 'Snittbetyg' },
  { value: '8 years', label: 'In the industry' },
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
            We were founded with a simple goal: to make professional cleaning easy, reliable
            and affordable for Stockholm homes and businesses.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="section-pad">
        <div className="container-tight grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <h2 className="font-display text-3xl text-neutral-900 mb-4">Our story</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Stockholm Cleaning Co. started as a small local business with the goal of
              raising the standard of cleaning services in Stockholm. We were tired of hearing about
              unreliable bookings, inconsistent quality and cleaners who were never the same.
            </p>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Today we are one of Stockholm's most trusted cleaning companies — with a team of
              trained, background-checked cleaners and a booking system that makes it
              enkelt att boka, omboka och betala, helt digitalt.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              We are approved RUT providers, hold F-tax and are fully
              insured — so you can feel safe every time we come to your home.
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
            <h2 className="font-display text-3xl text-neutral-900 mb-3">What we stand for</h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Four principles that guide everything we do, from the first booking to the last detail.
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
            <h2 className="font-display text-2xl sm:text-3xl mb-6">Why choose us?</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Approved RUT provider — you pay only half',
                'Holds F-tax and full liability insurance',
                'Bakgrundskontrollerad och utbildad personal',
                'The same cleaner at every visit',
                'Satisfaction guarantee — we fix it if anything is missed',
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
          <h2 className="font-display text-3xl text-white mb-4">Ready to book your cleaning?</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            It takes less than two minutes to book — and you can reschedule or cancel at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="teal" asChild>
              <Link href="/book">Boka nu <ArrowRight size={18} /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="bg-transparent border-brand-400 text-white hover:bg-brand-500">
              <Link href="/services">See our services</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
