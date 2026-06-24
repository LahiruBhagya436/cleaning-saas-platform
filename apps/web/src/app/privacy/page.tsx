import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const SECTIONS = [
  {
    title: '1. Vilka uppgifter vi samlar in',
    body: 'Vi samlar in namn, e-postadress, telefonnummer, adress och betalningsinformation när du skapar ett konto eller bokar en städning. Vi samlar även in uppgifter om dina bokningar, bostadens storlek och eventuella särskilda önskemål.',
  },
  {
    title: '2. Hur vi använder dina uppgifter',
    body: 'Dina uppgifter används för att leverera städtjänsten, skicka bokningsbekräftelser och fakturor, hantera betalningar via Stripe, samt för att kunna kontakta dig om din bokning. Vi använder aldrig dina uppgifter för att sälja till tredje part.',
  },
  {
    title: '3. Hur vi skyddar dina uppgifter',
    body: 'All data lagras krypterat och överförs via säkra anslutningar (TLS). Betalningsuppgifter hanteras av Stripe och lagras aldrig på våra egna servrar. Endast behörig personal har åtkomst till kunduppgifter.',
  },
  {
    title: '4. Delning med tredje part',
    body: 'Vi delar uppgifter med de underleverantörer som krävs för att leverera tjänsten: betalningsleverantör (Stripe), e-posttjänst (Resend) och, vid behov, Skatteverket för RUT-avdrag. Vi delar aldrig uppgifter för marknadsföringsändamål utan ditt samtycke.',
  },
  {
    title: '5. Dina rättigheter',
    body: 'Enligt GDPR har du rätt att begära ut, rätta eller radera dina personuppgifter. Kontakta oss på hej@cleaningco.se för att utöva dessa rättigheter. Vi svarar inom 30 dagar.',
  },
  {
    title: '6. Lagringstid',
    body: 'Bokningsuppgifter sparas i 7 år för att uppfylla bokföringslagens krav på fakturaunderlag. Kontouppgifter raderas inom 30 dagar efter att du begär att ditt konto ska avslutas.',
  },
  {
    title: '7. Kontakt',
    body: 'Har du frågor om hur vi hanterar dina personuppgifter? Kontakta oss på hej@cleaningco.se eller 08-123 456 78.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Integritetspolicy</h1>
          <p className="text-neutral-500">Senast uppdaterad: juni 2026</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-tight max-w-2xl mx-auto space-y-8">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-xl text-neutral-900 mb-2">{s.title}</h2>
              <p className="text-neutral-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
