import Link from 'next/link'
import { Check, ArrowRight, HelpCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { RutCalculator } from '@/components/shared/RutCalculator'

const SERVICES = [
  {
    name: 'Home cleaning',
    nameSv: 'Regular cleaning',
    price: 700,
    rutEligible: true,
    minHours: 2,
    icon: '🏠',
    popular: true,
    description: 'Perfect for regular cleaning of your home. We clean the kitchen, bathroom, bedroom and living room.',
    includes: [
      'Dammsugning och moppning av alla golv',
      'Cleaning of bathroom and toilet',
      'Kitchen including sink and stove',
      'Dusting of surfaces and furniture',
      'Making beds and changing bed linen',
    ],
  },
  {
    name: 'Deep cleaning',
    nameSv: 'Deep cleaning',
    price: 700,
    rutEligible: true,
    minHours: 4,
    icon: '✨',
    popular: false,
    description: 'A thorough cleaning from floor to ceiling. Perfect before a move, guests, or when extra is needed.',
    includes: [
      'Everything included in home cleaning',
      'Interior cleaning of oven and fridge',
      'Cleaning inside cabinets and drawers',
      'Window cleaning from the inside',
      'Badrumsfogar och avkalkningsbehandling',
    ],
  },
  {
    name: 'Move-out cleaning',
    nameSv: 'Move-in / move-out cleaning',
    price: 700,
    rutEligible: true,
    minHours: 5,
    icon: '📦',
    popular: false,
    description: 'Guaranteed approved cleaning for a move. We make sure you get your deposit back.',
    includes: [
      'Complete deep cleaning of the whole home',
      'Oven, fridge and freezer cleaned inside',
      'All cabinets and drawers emptied and cleaned',
      'Window cleaning inside and out',
      'Balcony or terrace included',
    ],
  },
  {
    name: 'Window cleaning',
    nameSv: 'Window cleaning',
    price: 600,
    rutEligible: true,
    minHours: 1,
    icon: '🪟',
    popular: false,
    description: 'Professional window cleaning for crystal-clear windows. We handle all types of windows.',
    includes: [
      'Interior and exterior cleaning',
      'Window frames and seals',
      'Window sills dusted',
      'Stain removal and drying',
      'Scheduling to your preferences',
    ],
  },
  {
    name: 'Office cleaning',
    nameSv: 'Office & business premises',
    price: 650,
    rutEligible: false,
    minHours: 2,
    icon: '🏢',
    popular: false,
    description: 'Keep the office clean and welcoming. We offer flexible schedules for your business.',
    includes: [
      'Reception area and offices',
      'Kitchen and break rooms',
      'Toaletter och hygienzoner',
      'Dammsugning och moppning',
      'Papperskorg och avfallshantering',
    ],
  },
  {
    name: 'Post-construction cleaning',
    nameSv: 'Final cleaning after renovation',
    price: 800,
    rutEligible: false,
    minHours: 4,
    icon: '🔨',
    popular: false,
    description: 'Cleaning after construction and renovation work. We take care of dust, dirt and building materials.',
    includes: [
      'Removal of construction dust from all surfaces',
      'Cleaning of floors, walls and ceilings',
      'Windows and door frames',
      'Kitchen and bathroom after installation',
      'Removal of light construction waste',
    ],
  },
]

const FAQ = [
  {
    q: 'Hur fungerar RUT-avdraget?',
    a: 'The RUT deduction gives you 50% off the labour cost for household services, up to SEK 75,000 per person per year. We handle the claim to Skatteverket for you — you pay only half the price directly.',
  },
  {
    q: 'What if I am not satisfied?',
    a: 'We offer a satisfaction guarantee. If you are not happy with the cleaning, contact us within 24 hours and we will come back and fix it at no extra cost.',
  },
  {
    q: 'Can I book recurring cleaning?',
    a: 'Yes! You can book weekly, every other week or monthly cleaning. Recurring bookings give you the same cleaner every time.',
  },
  {
    q: 'Do I need to be home during the cleaning?',
    a: 'No, most customers leave a key or code. You can leave instructions in the booking form.',
  },
  {
    q: 'What cleaning products do you bring?',
    a: 'We use eco-friendly cleaning products and bring everything we need. If you prefer specific products, just let us know.',
  },
  {
    q: 'Hur avbokar jag?',
    a: 'You can cancel for free up to 24 hours before your booked time. Cancelling is easy via your dashboard.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            RUT deduction — you pay only half
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">
            Enkla, transparenta priser
          </h1>
          <p className="text-lg text-neutral-500 max-w-lg mx-auto mb-8">
            No hidden fees. The price you see is the price you pay — after the RUT deduction.
          </p>
          <Button size="lg" asChild>
            <Link href="/book">
              Boka nu <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Services grid */}
      <section className="section-pad">
        <div className="container-tight">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const hoursLabel = `From ${service.minHours} hrs`
              const priceAfterRut = service.rutEligible
                ? Math.round(service.price * 0.5)
                : service.price

              return (
                <div
                  key={service.name}
                  className={`bg-white rounded-2xl border p-6 flex flex-col ${
                    service.popular
                      ? 'border-brand-300 shadow-lg ring-1 ring-brand-200'
                      : 'border-neutral-200'
                  }`}
                >
                  {service.popular && (
                    <div className="inline-flex self-start items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full mb-4">
                      ⭐ Most popular
                    </div>
                  )}

                  <div className="text-3xl mb-3">{service.icon}</div>
                  <h3 className="font-display text-xl text-neutral-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-neutral-500 mb-4">{service.description}</p>

                  {/* Pricing */}
                  <div className="bg-neutral-50 rounded-xl p-4 mb-5">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="font-display text-3xl text-neutral-900">
                        {service.price} kr
                      </span>
                      <span className="text-sm text-neutral-400">/timme</span>
                    </div>
                    {service.rutEligible ? (
                      <p className="text-sm text-teal-600 font-medium">
                        = {priceAfterRut} kr/tim efter RUT-avdrag
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-400">Not RUT-eligible</p>
                    )}
                    <p className="text-xs text-neutral-400 mt-1">{hoursLabel} · inkl. 25% moms</p>
                  </div>

                  {/* Includes */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-600">
                        <Check size={14} className="mt-0.5 shrink-0 text-teal-500" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    variant={service.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <Link href="/book">Boka {service.name.toLowerCase()}</Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* RUT Calculator */}
      <section className="section-pad bg-white border-y border-neutral-100">
        <div className="container-tight">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-neutral-900 mb-3">
              Calculate your price with RUT
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Ange antal timmar och se exakt vad du betalar efter RUT-avdraget.
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <RutCalculator />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad">
        <div className="container-tight">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl text-neutral-900 mb-3">
              Frequently asked questions
            </h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle size={18} className="text-brand-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900 mb-2">{q}</p>
                    <p className="text-sm text-neutral-500 leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-white mb-4">
            Redo att boka?
          </h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Book in 60 seconds. No commitment. Cancel for free up to 24 hours in advance.
          </p>
          <Button size="xl" variant="teal" asChild>
            <Link href="/book">
              Book cleaning now <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
