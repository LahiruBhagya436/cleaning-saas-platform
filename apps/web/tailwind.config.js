/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E6F1FB',
          100: '#C0D9F5',
          200: '#85B7EB',
          300: '#4A94E0',
          400: '#2278D4',
          500: '#185FA5',
          600: '#0C447C',
          700: '#093460',
          800: '#062444',
          900: '#031428',
        },
        teal: {
          50:  '#E1F5EE',
          100: '#B3E6D3',
          200: '#7FD3B3',
          300: '#4BBF93',
          400: '#27B07A',
          500: '#0F6E56',
          600: '#085041',
          700: '#05392E',
          800: '#03221B',
          900: '#010C09',
        },
        neutral: {
          50:  '#FAFAF8',
          100: '#F1EFE8',
          200: '#E2DFD5',
          300: '#C9C6BB',
          400: '#B0ADA0',
          500: '#888780',
          600: '#615F59',
          700: '#444441',
          800: '#2C2C2A',
          900: '#1A1A18',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)',    'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        lg:   '0.625rem',
        md:   '0.5rem',
        sm:   '0.375rem',
        xl:   '0.875rem',
        '2xl':'1rem',
      },
      boxShadow: {
        'card':      '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'modal':     '0 20px 60px -10px rgba(0,0,0,0.20)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}