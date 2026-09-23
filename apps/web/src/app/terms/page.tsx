import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const SECTIONS = [
  {
    title: '1. General',
    body: 'These terms apply to all bookings and purchases of services via Stockholm Cleaning Co. AB ("we", "us"). By booking a service you accept these terms.',
  },
  {
    title: '2. Booking and confirmation',
    body: 'A booking is binding once you have received a booking confirmation by email. We reserve the right to decline or reschedule in the event of force majeure or lack of availability.',
  },
  {
    title: '3. Priser och betalning',
    body: 'All prices are shown including VAT. Private individuals can apply for the RUT deduction, which halves the labour cost. Payment is made by invoice or card via our payment partner Stripe.',
  },
  {
    title: '4. Avbokning',
    body: 'Cancellation is free up to 24 hours before the booked time. For later cancellation, or if access to the home is not provided, a fee of 50% of the booking price may be charged.',
  },
  {
    title: '5. Liability and insurance',
    body: 'Stockholm Cleaning Co. AB is fully insured. Any damage arising in connection with the cleaning must be reported within 48 hours to be handled through the insurance.',
  },
  {
    title: '6. Reklamation',
    body: 'If you are not satisfied with the work performed, contact us within 24 hours and we will fix the issue free of charge under our satisfaction guarantee.',
  },
  {
    title: '7. Changes to the terms',
    body: 'We reserve the right to change these terms. Significant changes are communicated by email to registered customers at least 30 days in advance.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Terms of use</h1>
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
