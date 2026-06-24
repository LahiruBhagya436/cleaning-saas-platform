import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const SECTIONS = [
  {
    title: '1. Allmänt',
    body: 'Dessa villkor gäller för alla bokningar och köp av tjänster via Stockholm Cleaning Co. AB ("vi", "oss"). Genom att boka en tjänst godkänner du dessa villkor.',
  },
  {
    title: '2. Bokning och bekräftelse',
    body: 'En bokning är bindande när du fått en bokningsbekräftelse via e-post. Vi förbehåller oss rätten att neka eller ombooka vid force majeure eller bristande tillgänglighet.',
  },
  {
    title: '3. Priser och betalning',
    body: 'Alla priser anges inklusive moms. Privatpersoner kan ansöka om RUT-avdrag, vilket halverar arbetskostnaden. Betalning sker via faktura eller kortbetalning genom vår betalningspartner Stripe.',
  },
  {
    title: '4. Avbokning',
    body: 'Avbokning är kostnadsfri fram till 24 timmar innan bokad tid. Vid senare avbokning eller utebliven tillgång till bostaden kan en avgift motsvarande 50% av bokningens pris debiteras.',
  },
  {
    title: '5. Ansvar och försäkring',
    body: 'Stockholm Cleaning Co. AB är fullt ansvarsförsäkrat. Eventuella skador som uppstår i samband med städningen ska anmälas inom 48 timmar för att kunna hanteras via försäkringen.',
  },
  {
    title: '6. Reklamation',
    body: 'Är du inte nöjd med utfört arbete, kontakta oss inom 24 timmar så åtgärdar vi bristen kostnadsfritt enligt vår nöjd-kund-garanti.',
  },
  {
    title: '7. Ändringar av villkor',
    body: 'Vi förbehåller oss rätten att ändra dessa villkor. Väsentliga ändringar meddelas via e-post till registrerade kunder minst 30 dagar i förväg.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Användarvillkor</h1>
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
