// docs/designs/sign-in/tailwind.extend.js
//
// Token additions for the Sign In screen (and the rest of Footy Forecast —
// these are the project-wide design tokens, not screen-scoped).
//
// Two ways to use:
//
//   1. Import + spread into your existing config:
//
//        const designTokens = require('./docs/designs/sign-in/tailwind.extend');
//        module.exports = {
//          content: [...],
//          presets: [require('nativewind/preset')],
//          theme: { extend: { ...designTokens } },
//        };
//
//   2. Copy the inner properties directly into your existing `theme.extend`.
//
// All values come from the Broadcast aesthetic direction (terracotta accent,
// warm cream text, charcoal surfaces). Re-anchor `brand.*` if you switch
// directions later — semantic tokens stay stable.

module.exports = {
  colors: {
    // ── Surfaces (dark-warm) ────────────────────────────────────────
    bg: '#0E0B09',
    surface: {
      DEFAULT: '#181311',
      raised:  '#231B17',
      sunken:  '#0E0B09',
    },

    // ── Text on dark ────────────────────────────────────────────────
    ink: {
      DEFAULT: '#F5E8D2',                       // cream
      muted:   'rgba(245, 232, 210, 0.55)',
      dim:     'rgba(245, 232, 210, 0.35)',
      invert:  '#1A0E08',                       // on bright fills
    },

    // ── Hairlines / dividers ────────────────────────────────────────
    line: {
      DEFAULT: 'rgba(245, 232, 210, 0.08)',
      strong:  'rgba(245, 232, 210, 0.16)',
    },

    // ── Brand: terracotta (Broadcast canonical) ─────────────────────
    brand: {
      50:  '#FBEDE5',
      100: '#F4D3C0',
      200: '#EDB497',
      300: '#E4906A',
      400: '#DC7B4F',
      500: '#D86B3D',  // canonical accent
      600: '#B85530',
      700: '#8F4124',
      800: '#5F2B18',
      900: '#3B1A0E',
      soft: 'rgba(216, 107, 61, 0.14)',
    },

    // ── Status ──────────────────────────────────────────────────────
    success: '#7FB069',
    warning: '#E8A14B',
    danger:  '#D84A4A',
  },

  fontFamily: {
    // Strings must match the family names registered via expo-font /
    // @expo-google-fonts. Set during app boot in app/_layout.tsx.
    // Weight gotcha: on Android, custom-font weight utilities (font-semibold
    // etc.) won't auto-resolve to a heavier face — you typically register
    // each weight as a separate family and reach for `font-sans-semibold`
    // class tokens. See docs/designs/sign-in/README.md for the pattern.
    sans:    ['Inter_400Regular', 'system-ui', 'sans-serif'],
    mono:    ['JetBrainsMono_400Regular', 'ui-monospace', 'monospace'],
    display: ['SpaceGrotesk_600SemiBold', 'Inter_600SemiBold', 'sans-serif'],
  },

  fontSize: {
    // Additions to Tailwind defaults — does not replace the base scale.
    eyebrow: ['10.5px', { lineHeight: '14px',  letterSpacing: '1.6px' }],
    'hud-md': ['28px',  { lineHeight: '30px',  letterSpacing: '-0.6px' }],
    'hud-lg': ['40px',  { lineHeight: '42px',  letterSpacing: '-1.2px' }],
    'hud-xl': ['56px',  { lineHeight: '56px',  letterSpacing: '-2px'   }],
  },

  borderRadius: {
    card: '18px',
    tab:  '22px',
    pill: '999px',
  },

  spacing: {
    'screen-x':   '20px',
    'screen-top': '54px',
    'tab-h':      '64px',
  },

  boxShadow: {
    card:      '0 18px 40px rgba(0,0,0,0.45)',
    'card-sm': '0 8px 18px rgba(0,0,0,0.35)',
  },
};
