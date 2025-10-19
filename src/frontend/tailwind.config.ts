import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Semantic colors (shadcn/ui compatible)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand-specific colors
        brand: {
          purple: "hsl(var(--brand-purple))",
          lavender: "hsl(var(--brand-lavender))",
          accent: "hsl(var(--brand-accent))",
          ivory: "hsl(var(--brand-ivory))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",    // 24px - buttons
        "2xl": "2rem",   // 32px - cards
        "3xl": "3rem",   // 48px - special elements
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      fontFamily: {
        gordita: ['var(--font-gordita)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        lexend: ['var(--font-lexend)', 'sans-serif'],
        sans: ['var(--font-gordita)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1.4' }],   // 11px
        sm: ['0.75rem', { lineHeight: '1.5' }],      // 12px
        base: ['0.875rem', { lineHeight: '1.5' }],   // 14px mobile
        lg: ['1rem', { lineHeight: '1.5' }],         // 16px
        xl: ['1.125rem', { lineHeight: '1.4' }],     // 18px
        '2xl': ['1.25rem', { lineHeight: '1.4' }],   // 20px
        '3xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
        '4xl': ['2rem', { lineHeight: '1.2' }],      // 32px
        '5xl': ['3rem', { lineHeight: '1.2' }],      // 48px
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '112': '28rem',   // 448px
        '128': '32rem',   // 512px
      },
      minHeight: {
        'touch': '44px',  // Minimum touch target
      },
      minWidth: {
        'touch': '44px',  // Minimum touch target
      },
      maxWidth: {
        'prose': '65ch',
      },
      transitionDuration: {
        'fast': '150ms',
        'smooth': '300ms',
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

