'use client'

import Link from 'next/link'
import { ArrowLeft, Home, CalendarPlus, Layers, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── Quick-action cards ────────────────────────────────────────────────────────
const LINKS = [
  {
    icon: Home,
    label: 'Startsidan',
    desc:  'Till startsidan',
    href:  '/',
    color: 'text-brand-500',
    bg:    'bg-brand-50',
  },
  {
    icon: CalendarPlus,
    label: 'Book cleaning',
    desc:  'Book in 60 seconds',
    href:  '/book',
    color: 'text-teal-500',
    bg:    'bg-teal-50',
  },
  {
    icon: Layers,
    label: 'Services',
    desc:  'See all services & prices',
    href:  '/services',
    color: 'text-brand-500',
    bg:    'bg-brand-50',
  },
  {
    icon: LayoutDashboard,
    label: 'Mina bokningar',
    desc:  'Hantera dina bokningar',
    href:  '/dashboard',
    color: 'text-teal-500',
    bg:    'bg-teal-50',
  },
]

// ── Animated cleaning illustration ────────────────────────────────────────────
function CleaningIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto select-none" aria-hidden>
      {/* Sparkle keyframes injected inline so no extra CSS file is needed */}
      <style>{`
        @keyframes sparkle {
          0%,100% { opacity:0; transform:scale(0.5) rotate(0deg); }
          50%      { opacity:1; transform:scale(1)   rotate(20deg); }
        }
        @keyframes spray {
          0%   { transform:translateX(0)  scaleX(1); opacity:1; }
          60%  { transform:translateX(14px) scaleX(1.1); opacity:0.9; }
          100% { transform:translateX(0)  scaleX(1); opacity:1; }
        }
        @keyframes wipe {
          0%,100% { transform:rotate(-8deg)  translateX(0); }
          50%      { transform:rotate(8deg)   translateX(10px); }
        }
        .sparkle-1 { animation: sparkle 2.4s ease-in-out infinite; }
        .sparkle-2 { animation: sparkle 2.4s ease-in-out infinite 0.6s; }
        .sparkle-3 { animation: sparkle 2.4s ease-in-out infinite 1.2s; }
        .sparkle-4 { animation: sparkle 2.4s ease-in-out infinite 1.8s; }
        .mop-anim  { animation: wipe   2.4s ease-in-out infinite; transform-origin: center bottom; }
      `}</style>

      <svg viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* ── Ground / shine surface ── */}
        <ellipse cx="96" cy="162" rx="64" ry="8" fill="#E6F1FB" />

        {/* ── Mop handle ── */}
        <g className="mop-anim">
          {/* Handle */}
          <rect x="88" y="40" width="8" height="90" rx="4" fill="#0C447C" />
          {/* Grip */}
          <rect x="84" y="38" width="16" height="12" rx="4" fill="#185FA5" />
          {/* Mop head */}
          <rect x="60" y="128" width="72" height="14" rx="4" fill="#4A94E0" />
          {/* Mop strands */}
          {[64,72,80,88,96,104,112,120].map((x, i) => (
            <line key={i} x1={x} y1="142" x2={x - 4 + (i % 3) * 4} y2="162"
              stroke="#85B7EB" strokeWidth="3" strokeLinecap="round" />
          ))}
        </g>

        {/* ── Sparkles (twinkle on the clean surface) ── */}
        {/* Sparkle 1 — top right */}
        <g className="sparkle-1" style={{ transformOrigin: '148px 58px' }}>
          <path d="M148 50 L150 56 L156 58 L150 60 L148 66 L146 60 L140 58 L146 56 Z"
            fill="#0F6E56" />
        </g>
        {/* Sparkle 2 — top left */}
        <g className="sparkle-2" style={{ transformOrigin: '44px 74px' }}>
          <path d="M44 68 L46 72 L50 74 L46 76 L44 80 L42 76 L38 74 L42 72 Z"
            fill="#185FA5" />
        </g>
        {/* Sparkle 3 — mid right */}
        <g className="sparkle-3" style={{ transformOrigin: '158px 110px' }}>
          <path d="M158 104 L160 108 L164 110 L160 112 L158 116 L156 112 L152 110 L156 108 Z"
            fill="#0C447C" />
        </g>
        {/* Sparkle 4 — small, lower left */}
        <g className="sparkle-4" style={{ transformOrigin: '34px 130px' }}>
          <path d="M34 126 L35 129 L38 130 L35 131 L34 134 L33 131 L30 130 L33 129 Z"
            fill="#0F6E56" />
        </g>

        {/* ── Shine streak on floor ── */}
        <ellipse cx="80" cy="162" rx="28" ry="4" fill="white" opacity="0.6" />
      </svg>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-neutral-50 flex flex-col overflow-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-48 -right-48 h-[28rem] w-[28rem] rounded-full bg-brand-50 opacity-70" />
        <div className="absolute -bottom-48 -left-48 h-96 w-96 rounded-full bg-teal-50 opacity-50" />
      </div>

      {/* Minimal nav */}
      <header className="relative z-10 flex items-center px-6 pt-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-bold">
            SC
          </span>
          <span className="text-sm font-medium text-neutral-700 group-hover:text-brand-600 transition-colors">
            StockholmCleaning
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 text-center">

        {/* Illustration */}
        <div className="animate-fade-in mb-2">
          <CleaningIllustration />
        </div>

        {/* 404 number */}
        <p className="font-display text-[7rem] leading-none tracking-tight text-brand-600 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '50ms' }}>
          404
        </p>

        {/* Headline */}
        <h1 className="mt-3 font-display text-2xl text-neutral-900 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '150ms' }}>
          This page has been cleaned away
        </h1>

        {/* Subline */}
        <p className="mt-3 max-w-sm text-sm text-neutral-500 leading-relaxed animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          This page doesn't seem to exist — maybe you followed an old link,
          or maybe we cleaned a little too hard.
        </p>

        {/* Quick-action cards */}
        <div className="mt-10 grid grid-cols-2 gap-3 w-full max-w-xs animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '350ms' }}>
          {LINKS.map(({ icon: Icon, label, desc, href, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-card
                         transition-all duration-200 hover:shadow-card-hover hover:border-brand-200 hover:-translate-y-0.5"
            >
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color} transition-transform duration-200 group-hover:scale-110`}>
                <Icon size={16} />
              </span>
              <span>
                <p className="text-sm font-medium text-neutral-800">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
              </span>
            </Link>
          ))}
        </div>

        {/* Back link */}
        <div className="mt-8 animate-fade-up opacity-0"
          style={{ animationFillMode: 'forwards', animationDelay: '450ms' }}>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft size={14} />
              Go back to home
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer note */}
      <footer className="relative z-10 pb-6 text-center text-xs text-neutral-400 animate-fade-in delay-500">
        Felkod 404 · Stockholm Cleaning Co.
      </footer>
    </div>
  )
}
