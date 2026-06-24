import Link from 'next/link'
import { Sparkles, Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-400">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sparkles size={16} />
              </div>
              <span className="font-display text-lg text-white">
                Stockholm<span className="text-brand-300">Cleaning</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              Professionell städning i Stockholm. RUT-avdrag — du betalar bara hälften.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-teal-400 bg-teal-900/40 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              Godkänd för F-skatt
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Tjänster</h4>
            <ul className="space-y-2.5 text-sm">
              {['Hemstädning', 'Storstädning', 'Flyttstädning', 'Fönsterputning', 'Kontorstädning', 'Byggstädning'].map(s => (
                <li key={s}>
                  <Link href="/services" className="hover:text-neutral-200 transition-colors">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Företaget</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Om oss','/about'],['Priser','/pricing'],['Recensioner','/reviews'],['Arbeta hos oss','/careers'],['Integritetspolicy','/privacy']].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-neutral-200 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-neutral-500" />
                <a href="tel:+46812345678" className="hover:text-neutral-200 transition-colors">08-123 456 78</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-neutral-500" />
                <a href="mailto:hej@cleaningco.se" className="hover:text-neutral-200 transition-colors">hej@cleaningco.se</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-neutral-500 mt-0.5 shrink-0" />
                <span>Drottninggatan 12<br />111 51 Stockholm</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} Stockholm Cleaning Co. AB · Org.nr 556000-0000</p>
          <p>Godkänd RUT-leverantör · F-skatt · Ansvarsförsäkrad</p>
        </div>
      </div>
    </footer>
  )
}
