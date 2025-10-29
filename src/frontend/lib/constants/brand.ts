/**
 * Bloem Brand Constants
 * 
 * Central source of truth for brand colors, sizes, and values.
 * Use these constants for TypeScript/JS logic where Tailwind classes aren't applicable.
 */

export const BRAND_COLORS = {
  purple: '#6B22B1',
  lavender: '#B79CED',
  accent: '#BED35C',
  ivory: '#F7F4F2',
  
  // Neutral colors
  charcoal: '#2D2D2D',
  slateGray: '#6B7280',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  
  // Semantic colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export const BRAND_FONTS = {
  primary: 'var(--font-gordita)',
  secondary: 'var(--font-lexend)',
  fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const TOUCH_TARGET = {
  minimum: 44,      // px - W3C/Apple guideline
  preferred: 48,    // px - Material Design guideline
  spacing: 8,       // px - Minimum spacing between touch targets
} as const;

export const BORDER_RADIUS = {
  button: '1.5rem',      // 24px
  card: '2rem',          // 32px
  cardLarge: '3rem',     // 48px
  input: '1rem',         // 16px
  badge: '9999px',       // Full rounded (pill)
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BREAKPOINTS = {
  mobile: 0,
  sm: 640,
  md: 768,
  tablet: 768,
  lg: 1024,
  desktop: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const FONT_SIZES = {
  caption: '0.6875rem',      // 11px
  small: '0.75rem',          // 12px
  base: '0.875rem',          // 14px
  body: '0.875rem',          // 14px
  large: '1rem',             // 16px
  xl: '1.125rem',            // 18px
  '2xl': '1.25rem',          // 20px
  '3xl': '1.5rem',           // 24px
  '4xl': '2rem',             // 32px
  '5xl': '3rem',             // 48px
} as const;

export const ANIMATION_DURATION = {
  fast: 150,        // ms
  default: 200,     // ms
  smooth: 300,      // ms
  slow: 500,        // ms
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
} as const;

export const IMAGE_SIZES = {
  thumbnail: {
    width: 400,
    maxSize: 100 * 1024,  // 100KB
  },
  full: {
    width: 1920,
    maxSize: 5 * 1024 * 1024,  // 5MB
  },
  avatar: {
    small: 32,
    medium: 48,
    large: 96,
  },
} as const;

export const LOGO_SIZES = {
  mobile: {
    height: 32,
  },
  desktop: {
    height: 40,
  },
  minimum: {
    height: 24,
  },
} as const;

/**
 * Brand usage guidelines
 */
export const BRAND_USAGE = {
  accentColorMaxUsage: 0.15,  // Maximum 15% usage for accent color
  accentButtonsPerScreen: 1,   // Maximum 1 accent button per screen
  clearSpaceMultiplier: 1/3,  // Logo clear space = 1/3 of logo height
} as const;

/**
 * Accessibility minimums
 */
export const ACCESSIBILITY = {
  contrastRatio: {
    normal: 4.5,   // WCAG AA for normal text
    large: 3,      // WCAG AA for large text (18px+ or 14px+ bold)
    ui: 3,         // WCAG AA for UI components
  },
  focusRingWidth: 2,  // px
} as const;

/**
 * Performance budgets
 */
export const PERFORMANCE = {
  budgets: {
    initialBundle: 170 * 1024,      // 170KB gzipped
    totalJavaScript: 350 * 1024,    // 350KB gzipped
    imagesPerPage: 1 * 1024 * 1024, // 1MB total
    webFonts: 100 * 1024,           // 100KB
    css: 50 * 1024,                 // 50KB gzipped
  },
  coreWebVitals: {
    lcp: 2500,     // ms - Largest Contentful Paint
    fid: 100,      // ms - First Input Delay
    cls: 0.1,      // Cumulative Layout Shift
    fcp: 1800,     // ms - First Contentful Paint
    tti: 3800,     // ms - Time to Interactive
  },
} as const;

/**
 * Helper function to get brand color with opacity
 */
export function getBrandColorWithOpacity(color: keyof typeof BRAND_COLORS, opacity: number): string {
  const hex = BRAND_COLORS[color];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Helper function to check if screen width matches breakpoint
 */
export function isBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

/**
 * Helper function to check if touch device
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

