import Link from 'next/link'
import { ArrowRight, Clock, Check, Star } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const SERVICES = [
  {
    name: 'Home cleaning',
    slug: 'hemstadning',
    icon: '🏠',
    tagline: 'Regular cleaning for a clean and healthy home',
    price: 700,
    rutEligible: true,
    minHours: 2,
    popular: true,
    description:
      'Home cleaning is our most popular service. We take care of every surface in your home so you can focus on what matters. Book weekly, every other week or monthly — and get the same cleaner every time.',
    includes: [
      'Dammsugning och moppning av alla golv',
      'Cleaning of bathrooms and toilets',
      'Kitchen including stove, sink and microwave',
      'Dusting of furniture, shelves and window sills',
      'Changing bed linen and making beds',
      'Emptying wastebaskets',
    ],
    notIncludes: [
      'Interior oven cleaning (included in deep cleaning)',
      'Exterior window cleaning',
      'Balkong eller uteplats',
    ],
    duration: '2–4 hours depending on size',
    ideal: 'Families, couples and singles who want a clean home without having to think about it',
  },
  {
    name: 'Deep cleaning',
    slug: 'storstadning',
    icon: '✨',
    tagline: 'A thorough cleaning from floor to ceiling',
    price: 700,
    rutEligible: true,
    minHours: 4,
    popular: false,
    description:
      'Deep cleaning is a thorough clean of the entire home. Perfect when a little extra is needed — before a move, holidays, guests, or just when you want a really fresh home.',
    includes: [
      'Everything included in home cleaning',
      'Interior oven cleaning',
      'Cleaning inside fridge and freezer',
      'Inside kitchen cabinets and drawers',
      'Window cleaning from the inside',
      'Badrumsfogar och avkalkningsbehandling',
      'Behind and under furniture',
    ],
    notIncludes: [
      'Exterior window cleaning',
      'Balkong (tillval)',
    ],
    duration: '4–8 hours depending on size',
    ideal: 'Before a move, seasonal cleaning, or when you want a thorough result',
  },
  {
    name: 'Move-out cleaning',
    slug: 'flyttstadning',
    icon: '📦',
    tagline: 'Guaranteed approved cleaning — get your deposit back',
    price: 700,
    rutEligible: true,
    minHours: 5,
    popular: false,
    description:
      'Move-out cleaning is a complete clean of the entire home for a move. We clean to landlord and housing-association requirements, and offer follow-up if anything needs fixing.',
    includes: [
      'Complete deep cleaning of all rooms',
      'Oven, fridge and freezer cleaned inside',
      'All cabinets and drawers emptied and cleaned',
      'Window cleaning inside and out',
      'Balkong eller terrass',
      'Badrummet inklusive kakel och fogar',
      'Wardrobes and storage spaces',
    ],
    notIncludes: [
      'Storage room and garage (optional)',
    ],
    duration: '5–10 hours depending on size',
    ideal: 'When moving out or in — make sure you get your deposit back',
  },
  {
    name: 'Window cleaning',
    slug: 'fonsterputsning',
    icon: '🪟',
    tagline: 'Crystal-clear windows — professional and fast',
    price: 600,
    rutEligible: true,
    minHours: 1,
    popular: false,
    description:
      'Professional window cleaning gives your home a lift and more natural light. We handle all types of windows — from simple ones to casement and top-hung windows.',
    includes: [
      'Interior and exterior window cleaning',
      'Window frames and seals',
      'Window sills dusted',
      'Stain removal and polishing',
    ],
    notIncludes: [
      'Skylights above 3 metres (contact us for a quote)',
    ],
    duration: '1–3 hours depending on number of windows',
    ideal: 'Spring and autumn, or when you want more light in your home',
  },
  {
    name: 'Office cleaning',
    slug: 'kontorstadning',
    icon: '🏢',
    tagline: 'Rent och professionellt kontor — varje dag',
    price: 650,
    rutEligible: false,
    minHours: 2,
    popular: false,
    description:
      'We keep your office or business premises clean and welcoming. Flexible schedules — morning, evening or weekend — tailored to your business.',
    includes: [
      'Reception och kontor',
      'Kitchen and break rooms',
      'Toaletter och hygienzoner',
      'Dammsugning och moppning av alla ytor',
      'Papperskorgar och avfallshantering',
      'Dusting of desks and furniture',
    ],
    notIncludes: [
      'Exterior window cleaning',
      'Deep cleaning of the kitchen (optional)',
    ],
    duration: 'Anpassas efter lokalens storlek',
    ideal: 'Kontor, butiker, salonger och andra verksamhetslokaler',
  },
  {
    name: 'Post-construction cleaning',
    slug: 'byggstadning',
    icon: '🔨',
    tagline: 'Professional final cleaning after renovation or construction',
    price: 800,
    rutEligible: false,
    minHours: 4,
    popular: false,
    description:
      'After a construction or renovation project there is often dust and dirt everywhere. We specially clean the premises and make sure everything is ready for move-in or opening.',
    includes: [
      'Removal of construction dust from all surfaces',
      'Floors, walls and ceilings cleaned',
      'Windows and door frames',
      'Kitchen and bathroom after installation',
      'Removal of light construction waste',
      'Slutinspektionsprotokoll',
    ],
    notIncludes: [
      'Heavy equipment or skip (referred to a separate service)',
    ],
    duration: '4–12 hours depending on project size',
    ideal: 'Nybyggnation, renovering, om- eller tillbyggnad',
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">
            Our cleaning services
          </h1>
          <p className="text-lg text-neutral-500 max-w-lg mx-auto mb-8">
            Professional cleaning for homes, offices and premises in Stockholm.
            RUT deduction on all private bookings.
          </p>
          <Button size="lg" asChild>
            <Link href="/book">
              Boka nu <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Services */}
      <section className="section-pad">
        <div className="container-tight space-y-8">
          {SERVICES.map((service, idx) => (
            <div
              key={service.slug}
              className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden ${
                service.popular ? 'ring-2 ring-brand-200' : ''
              }`}
            >
              {service.popular && (
                <div className="bg-brand-600 text-white text-xs font-medium text-center py-2">
                  ⭐ Most popular service
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className={`grid gap-8 ${idx % 2 === 0 ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[320px_1fr]'}`}>
                  {/* Main content */}
                  <div className={idx % 2 !== 0 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl">{service.icon}</span>
                      <div>
                        <h2 className="font-display text-2xl text-neutral-900">{service.name}</h2>
                        <p className="text-sm text-neutral-500">{service.tagline}</p>
                      </div>
                    </div>

                    <p className="text-neutral-600 leading-relaxed mb-6">{service.description}</p>

                    {/* What's included */}
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Included</p>
                        <ul className="space-y-2">
                          {service.includes.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                              <Check size={14} className="text-teal-500 mt-0.5 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Not included</p>
                        <ul className="space-y-2">
                          {service.notIncludes.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-neutral-400">
                              <span className="mt-1 shrink-0">—</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex items-start gap-2 text-sm text-neutral-500">
                          <Clock size={14} className="mt-0.5 shrink-0 text-neutral-400" />
                          {service.duration}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price card */}
                  <div className={`${idx % 2 !== 0 ? 'lg:order-1' : ''}`}>
                    <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 h-full flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Pris</p>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="font-display text-4xl text-neutral-900">{service.price}</span>
                          <span className="text-neutral-400 text-sm">kr/timme</span>
                        </div>
                        {service.rutEligible ? (
                          <p className="text-sm text-teal-600 font-medium mb-1">
                            = {Math.round(service.price * 0.5)} kr/tim efter RUT
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-400 mb-1">Not RUT-eligible</p>
                        )}
                        <p className="text-xs text-neutral-400 mb-6">inkl. 25% moms · min {service.minHours} tim</p>

                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Ideal for</p>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-6">{service.ideal}</p>

                        {service.rutEligible && (
                          <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs px-3 py-2 rounded-lg mb-6">
                            <Star size={12} className="fill-teal-500 text-teal-500" />
                            RUT deduction — you pay only half
                          </div>
                        )}
                      </div>

                      <Button asChild className="w-full">
                        <Link href="/book">
                          Boka {service.name.toLowerCase()} <ArrowRight size={14} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-white mb-4">Not sure which service you need?</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Book a home cleaning — our cleaner assesses what is needed and adapts the cleaning to your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" variant="teal" asChild>
              <Link href="/book">Boka nu <ArrowRight size={18} /></Link>
            </Button>
            <Button size="xl" variant="outline" asChild className="bg-transparent border-brand-400 text-white hover:bg-brand-500">
              <Link href="/pricing">Se priser</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
