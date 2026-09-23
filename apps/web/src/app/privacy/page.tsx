import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const SECTIONS = [
  {
    title: '1. Vilka uppgifter vi samlar in',
    body: 'We collect your name, email address, phone number, address and payment information when you create an account or book a cleaning. We also collect information about your bookings, the size of your home and any special requests.',
  },
  {
    title: '2. How we use your data',
    body: 'Your data is used to deliver the cleaning service, send booking confirmations and invoices, handle payments via Stripe, and to contact you about your booking. We never use your data to sell to third parties.',
  },
  {
    title: '3. Hur vi skyddar dina uppgifter',
    body: 'All data is stored encrypted and transferred over secure connections (TLS). Payment details are handled by Stripe and never stored on our own servers. Only authorised staff have access to customer data.',
  },
  {
    title: '4. Delning med tredje part',
    body: 'We share data with the subcontractors required to deliver the service: payment provider (Stripe), email service (Resend) and, when needed, Skatteverket for the RUT deduction. We never share data for marketing purposes without your consent.',
  },
  {
    title: '5. Your rights',
    body: 'Under GDPR you have the right to request, correct or delete your personal data. Contact us at hej@cleaningco.se to exercise these rights. We respond within 30 days.',
  },
  {
    title: '6. Lagringstid',
    body: 'Booking data is kept for 7 years to meet accounting-law requirements for invoice records. Account data is deleted within 30 days after you request that your account be closed.',
  },
  {
    title: '7. Kontakt',
    body: 'Do you have questions about how we handle your personal data? Contact us at hej@cleaningco.se or 08-123 456 78.',
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
