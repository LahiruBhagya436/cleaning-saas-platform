import Link from 'next/link'
import { Check, ArrowRight, HelpCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { RutCalculator } from '@/components/shared/RutCalculator'

const SERVICES = [
  {
    name: 'Hemstädning',
    nameSv: 'Regelbunden städning',
    price: 700,
    rutEligible: true,
    minHours: 2,
    icon: '🏠',
    popular: true,
    description: 'Perfekt för regelbunden städning av ditt hem. Vi städar kök, badrum, sovrum och vardagsrum.',
    includes: [
      'Dammsugning och moppning av alla golv',
      'Rengöring av badrum och toalett',
      'Kök inklusive diskbänk och spis',
      'Dammtorkning av ytor och möbler',
      'Bäddning och byte av sängkläder',
    ],
  },
  {
    name: 'Storstädning',
    nameSv: 'Djuprengöring',
    price: 700,
    rutEligible: true,
    minHours: 4,
    icon: '✨',
    popular: false,
    description: 'En grundlig städning från golv till tak. Perfekt inför flytt, gäster eller när det behövs extra.',
    includes: [
      'Allt som ingår i hemstädning',
      'Invändig rengöring av ugn och kyl',
      'Rengöring inuti skåp och lådor',
      'Fönsterputsning inifrån',
      'Badrumsfogar och avkalkningsbehandling',
    ],
  },
  {
    name: 'Flyttstädning',
    nameSv: 'Inflyttnings- / utflyttningsstädning',
    price: 700,
    rutEligible: true,
    minHours: 5,
    icon: '📦',
    popular: false,
    description: 'Garanterat godkänd städning vid flytt. Vi ser till att du får tillbaka din deposition.',
    includes: [
      'Komplett djuprengöring av hela bostaden',
      'Ugn, kyl och frys rengörs invändigt',
      'Alla skåp och lådor töms och rengörs',
      'Fönsterputsning in- och utvändigt',
      'Balkong eller terrass ingår',
    ],
  },
  {
    name: 'Fönsterputsning',
    nameSv: 'Fönsterputsning',
    price: 600,
    rutEligible: true,
    minHours: 1,
    icon: '🪟',
    popular: false,
    description: 'Professionell fönsterputs för kristallklara fönster. Vi hanterar alla typer av fönster.',
    includes: [
      'In- och utvändig rengöring',
      'Fönsterkarmar och tätningslister',
      'Fönsterbräden dammtorkas',
      'Fläckborttagning och torkning',
      'Tidbokning efter dina önskemål',
    ],
  },
  {
    name: 'Kontorstädning',
    nameSv: 'Kontor & företagslokaler',
    price: 650,
    rutEligible: false,
    minHours: 2,
    icon: '🏢',
    popular: false,
    description: 'Håll kontoret rent och välkomnande. Vi erbjuder flexibla scheman för ditt företag.',
    includes: [
      'Receptionsområde och kontor',
      'Kök och pausrum',
      'Toaletter och hygienzoner',
      'Dammsugning och moppning',
      'Papperskorg och avfallshantering',
    ],
  },
  {
    name: 'Byggstädning',
    nameSv: 'Slutstädning efter renovering',
    price: 800,
    rutEligible: false,
    minHours: 4,
    icon: '🔨',
    popular: false,
    description: 'Städning efter bygg- och renoveringsarbeten. Vi tar hand om damm, smuts och byggmaterial.',
    includes: [
      'Borttagning av byggdamm på alla ytor',
      'Rengöring av golv, väggar och tak',
      'Fönster och dörrkarmar',
      'Kök och badrum efter installation',
      'Bortforsling av lättare byggavfall',
    ],
  },
]

const FAQ = [
  {
    q: 'Hur fungerar RUT-avdraget?',
    a: 'RUT-avdrag ger dig 50% rabatt på arbetskostnaden för hushållstjänster, upp till 75 000 kr per person och år. Vi hanterar ansökan till Skatteverket åt dig — du betalar bara halva priset direkt.',
  },
  {
    q: 'Vad händer om jag inte är nöjd?',
    a: 'Vi erbjuder nöjdhetsgaranti. Om du inte är nöjd med städningen kontaktar du oss inom 24 timmar så kommer vi tillbaka och åtgärdar det utan extra kostnad.',
  },
  {
    q: 'Kan jag boka återkommande städning?',
    a: 'Ja! Du kan boka veckovis, varannan vecka eller månadsvis städning. Återkommande bokningar ger dig samma städare varje gång.',
  },
  {
    q: 'Behöver jag vara hemma under städningen?',
    a: 'Nej, de flesta kunder lämnar en nyckel eller kod. Du kan lämna instruktioner i bokningsformuläret.',
  },
  {
    q: 'Vad tar ni med för städprodukter?',
    a: 'Vi använder miljövänliga städprodukter och tar med allt vi behöver. Om du föredrar specifika produkter kan du meddela oss det.',
  },
  {
    q: 'Hur avbokar jag?',
    a: 'Du kan avboka gratis upp till 24 timmar före din bokade tid. Avbokning sker enkelt via din dashboard.',
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
            RUT-avdrag — du betalar bara hälften
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">
            Enkla, transparenta priser
          </h1>
          <p className="text-lg text-neutral-500 max-w-lg mx-auto mb-8">
            Inga dolda avgifter. Priset du ser är priset du betalar — efter RUT-avdrag.
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
              const hoursLabel = `Från ${service.minHours} tim`
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
                      ⭐ Populärast
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
                      <p className="text-xs text-neutral-400">Ej RUT-berättigad</p>
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
              Räkna ut ditt pris med RUT
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
              Vanliga frågor
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
            Boka på 60 sekunder. Ingen bindningstid. Avboka gratis upp till 24 timmar i förväg.
          </p>
          <Button size="xl" variant="teal" asChild>
            <Link href="/book">
              Boka städning nu <ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
