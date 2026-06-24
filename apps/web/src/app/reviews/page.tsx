import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'

const REVIEWS = [
  { name: 'Anna L.', area: 'Södermalm', rating: 5, text: 'Fantastisk service! Samma städare varje gång och alltid lika noggrann. Kan varmt rekommendera.' },
  { name: 'Erik S.', area: 'Vasastan', rating: 5, text: 'Bokade flyttstädning och fick tillbaka hela depositionen. Proffsigt jobb från start till slut.' },
  { name: 'Fatima K.', area: 'Kungsholmen', rating: 5, text: 'Enkel bokning, tydlig prissättning och RUT-avdraget gjorde det riktigt prisvärt.' },
  { name: 'Johan B.', area: 'Östermalm', rating: 4, text: 'Mycket nöjd med hemstädningen. Enda minus är att det ibland är svårt att få exakt önskad tid.' },
  { name: 'Maria T.', area: 'Bromma', rating: 5, text: 'Har använt dem i över ett år för veckostädning. Pålitliga och alltid trevliga.' },
  { name: 'Daniel H.', area: 'Liljeholmen', rating: 5, text: 'Kontorstädning av hög klass. Vårt kontor har aldrig sett bättre ut.' },
]

export default function ReviewsPage() {
  const avg = (REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length).toFixed(1)

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <section className="bg-white border-b border-neutral-100">
        <div className="container-tight section-pad text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 mb-4">Vad våra kunder säger</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-display text-2xl text-neutral-900">{avg}</span>
            <span className="text-neutral-500">av 5 · 2 400+ recensioner</span>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-tight grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}
                  />
                ))}
              </div>
              <p className="text-neutral-600 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
              <p className="text-sm font-medium text-neutral-900">{r.name}</p>
              <p className="text-xs text-neutral-400">{r.area}, Stockholm</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-pad bg-brand-600 text-white">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-white mb-4">Bli vår nästa nöjda kund</h2>
          <p className="text-brand-200 mb-8 max-w-md mx-auto">
            Boka din första städning idag och se varför våra kunder stannar år efter år.
          </p>
          <Button size="xl" variant="teal" asChild>
            <Link href="/book">Boka nu <ArrowRight size={18} /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
