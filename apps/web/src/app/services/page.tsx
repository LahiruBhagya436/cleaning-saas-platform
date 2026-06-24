import Link from 'next/link'
import { ArrowRight, Clock, Check, Star } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const SERVICES = [
  {
    name: 'Hemstädning',
    slug: 'hemstadning',
    icon: '🏠',
    tagline: 'Regelbunden städning för ett rent och välmående hem',
    price: 700,
    rutEligible: true,
    minHours: 2,
    popular: true,
    description:
      'Hemstädning är vår mest populära tjänst. Vi sköter alla ytor i ditt hem så att du kan fokusera på det som är viktigt. Boka veckovis, varannan vecka eller månadsvis — och få samma städare varje gång.',
    includes: [
      'Dammsugning och moppning av alla golv',
      'Rengöring av badrum och toaletter',
      'Kök inklusive spis, diskbänk och mikrougn',
      'Dammtorkning av möbler, hyllor och fönsterbräden',
      'Byte av sängkläder och bäddning',
      'Tömning av papperskorgar',
    ],
    notIncludes: [
      'Invändig ugnsrengöring (ingår i storstädning)',
      'Fönsterputsning utvändigt',
      'Balkong eller uteplats',
    ],
    duration: '2–4 timmar beroende på storlek',
    ideal: 'Familjer, par och singlar som vill ha ett rent hem utan att behöva tänka på det',
  },
  {
    name: 'Storstädning',
    slug: 'storstadning',
    icon: '✨',
    tagline: 'En grundlig städning från golv till tak',
    price: 700,
    rutEligible: true,
    minHours: 4,
    popular: false,
    description:
      'Storstädning är en djupgående rengöring av hela bostaden. Perfekt när det behövs lite extra — inför flytt, högtider, gäster eller bara när du vill ha ett riktigt fräscht hem.',
    includes: [
      'Allt som ingår i hemstädning',
      'Invändig ugnsrengöring',
      'Rengöring inuti kyl och frys',
      'Invändiga skåp och lådor i kök',
      'Fönsterputsning inifrån',
      'Badrumsfogar och avkalkningsbehandling',
      'Bakom och under möbler',
    ],
    notIncludes: [
      'Fönsterputsning utvändigt',
      'Balkong (tillval)',
    ],
    duration: '4–8 timmar beroende på storlek',
    ideal: 'Inför flytt, säsongsrengöring eller när du vill ha ett grundligt resultat',
  },
  {
    name: 'Flyttstädning',
    slug: 'flyttstadning',
    icon: '📦',
    tagline: 'Garanterat godkänd städning — få tillbaka din deposition',
    price: 700,
    rutEligible: true,
    minHours: 5,
    popular: false,
    description:
      'Flyttstädning är en komplett rengöring av hela bostaden i samband med flytt. Vi utför städningen enligt hyresvärdens och bostadsrättsföreningarnas krav, och erbjuder återkoppling om något behöver åtgärdas.',
    includes: [
      'Komplett djuprengöring av alla rum',
      'Ugn, kyl och frys rengörs invändigt',
      'Alla skåp och lådor töms och rengörs',
      'Fönsterputsning in- och utvändigt',
      'Balkong eller terrass',
      'Badrummet inklusive kakel och fogar',
      'Garderober och förvaringsutrymmen',
    ],
    notIncludes: [
      'Förråd och garage (tillval)',
    ],
    duration: '5–10 timmar beroende på storlek',
    ideal: 'Vid utflyttning eller inflyttning — säkerställ att du får tillbaka depositionen',
  },
  {
    name: 'Fönsterputsning',
    slug: 'fonsterputsning',
    icon: '🪟',
    tagline: 'Kristallklara fönster — professionellt och snabbt',
    price: 600,
    rutEligible: true,
    minHours: 1,
    popular: false,
    description:
      'Professionell fönsterputs ger ditt hem ett lyft och mer naturligt ljus. Vi hanterar alla typer av fönster — från enkla till båge- och toppfönster.',
    includes: [
      'In- och utvändig fönsterputsning',
      'Fönsterkarmar och tätningslister',
      'Fönsterbräden dammtorkas',
      'Fläckborttagning och polering',
    ],
    notIncludes: [
      'Takfönster på mer än 3 meters höjd (kontakta oss för offert)',
    ],
    duration: '1–3 timmar beroende på antal fönster',
    ideal: 'Vår och höst, eller när du vill ha mer ljus i hemmet',
  },
  {
    name: 'Kontorstädning',
    slug: 'kontorstadning',
    icon: '🏢',
    tagline: 'Rent och professionellt kontor — varje dag',
    price: 650,
    rutEligible: false,
    minHours: 2,
    popular: false,
    description:
      'Vi håller ditt kontor eller företagslokal ren och välkomnande. Flexibla scheman — morgon, kväll eller helg — anpassade efter din verksamhet.',
    includes: [
      'Reception och kontor',
      'Kök och pausrum',
      'Toaletter och hygienzoner',
      'Dammsugning och moppning av alla ytor',
      'Papperskorgar och avfallshantering',
      'Dammtorkning av skrivbord och möbler',
    ],
    notIncludes: [
      'Fönsterputsning utvändigt',
      'Djuprengöring av kök (tillval)',
    ],
    duration: 'Anpassas efter lokalens storlek',
    ideal: 'Kontor, butiker, salonger och andra verksamhetslokaler',
  },
  {
    name: 'Byggstädning',
    slug: 'byggstadning',
    icon: '🔨',
    tagline: 'Professionell slutstädning efter renovering eller bygge',
    price: 800,
    rutEligible: false,
    minHours: 4,
    popular: false,
    description:
      'Efter ett bygge eller renoveringsprojekt finns ofta damm och smuts överallt. Vi specialrengör lokalen och ser till att allt är redo för inflyttning eller öppnande.',
    includes: [
      'Borttagning av byggdamm på alla ytor',
      'Golv, väggar och tak rengörs',
      'Fönster och dörrkarmar',
      'Kök och badrum efter installation',
      'Bortforsling av lättare byggavfall',
      'Slutinspektionsprotokoll',
    ],
    notIncludes: [
      'Tung utrustning eller container (hänvisas till separat tjänst)',
    ],
    duration: '4–12 timmar beroende på projektets storlek',
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
            Våra städtjänster
          </h1>
          <p className="text-lg text-neutral-500 max-w-lg mx-auto mb-8">
            Professionell städning för hem, kontor och lokaler i Stockholm.
            RUT-avdrag på alla privatbokningar.
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
                  ⭐ Mest populär tjänst
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
                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Ingår</p>
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
                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Ingår ej</p>
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
                          <p className="text-xs text-neutral-400 mb-1">Ej RUT-berättigad</p>
                        )}
                        <p className="text-xs text-neutral-400 mb-6">inkl. 25% moms · min {service.minHours} tim</p>

                        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Passar för</p>
                        <p className="text-sm text-neutral-600 leading-relaxed mb-6">{service.ideal}</p>

                        {service.rutEligible && (
                          <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs px-3 py-2 rounded-lg mb-6">
                            <Star size={12} className="fill-teal-500 text-teal-500" />
                            RUT-avdrag — du betalar bara hälften
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
          <h2 className="font-display text-3xl text-white mb-4">Osäker på vilken tjänst du behöver?</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Boka en hemstädning — vår städare bedömer vad som behövs och anpassar städningen efter ditt hem.
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
