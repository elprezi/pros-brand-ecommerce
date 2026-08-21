/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pros: {
          black: '#0a0a0a',
          dark: '#141414',
          card: '#1a1a1a',
          grey: '#2a2a2a',
          muted: '#888888',
          lightgrey: '#e8e7e3',
          offwhite: '#f7f6f2',
          sand: '#d5caaf',
          gold: '#c5a059',
        }
      },
      fontFamily: {
        sans: ['var(--font-pros)', 'Times New Roman', 'Times', 'serif'],
        display: ['var(--font-pros)', 'Times New Roman', 'Times', 'serif'],
        serif: ['var(--font-pros)', 'Times New Roman', 'Times', 'serif'],
        mono: ['var(--font-mono-pros)', 'JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        superwide: '0.25em',
        ultra: '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
