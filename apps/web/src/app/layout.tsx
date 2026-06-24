import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, DM_Sans, DM_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { Providers } from '@/components/layout/Providers'
import './globals.css'

const dmSerifDisplay = DM_Serif_Display({
  weight:   ['400'],
  style:    ['normal', 'italic'],
  subsets:  ['latin'],
  variable: '--font-display',
  display:  'swap',
})

const dmSans = DM_Sans({
  weight:   ['300', '400', '500', '600'],
  subsets:  ['latin'],
  variable: '--font-sans',
  display:  'swap',
})

const dmMono = DM_Mono({
  weight:   ['400', '500'],
  subsets:  ['latin'],
  variable: '--font-mono',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Stockholm Cleaning Co. — Professional Cleaning Services',
    template: '%s | Stockholm Cleaning Co.',
  },
  description:
    'Book professional cleaning services in Stockholm. ' +
    'RUT-avdrag available — pay only 50% with Swedish tax deduction. ' +
    'Hemstädning, storstädning, flyttstädning och mer.',
  keywords: [
    'städning stockholm', 'hemstädning', 'storstädning',
    'RUT-avdrag', 'städfirma stockholm', 'cleaning stockholm',
  ],
  authors:    [{ name: 'Stockholm Cleaning Co.' }],
  creator:    'Stockholm Cleaning Co.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    type:        'website',
    locale:      'sv_SE',
    url:         '/',
    siteName:    'Stockholm Cleaning Co.',
    title:       'Professional Cleaning Services in Stockholm',
    description: 'Book a clean online in 60 seconds. RUT-avdrag — pay only half.',
  },
  twitter: {
    card:  'summary_large_image',
    title: 'Stockholm Cleaning Co.',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor:  '#0C447C',
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="sv"
      className={`${dmSerifDisplay.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-sans)',
                borderRadius: '10px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
