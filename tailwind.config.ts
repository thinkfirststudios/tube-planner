import type { Config } from 'tailwindcss';

// Every color is a CSS custom property defined in src/index.css.
// A dark theme is a token swap there, not a change here.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--color-ground)',
        surface: 'var(--color-surface)',
        rule: 'var(--color-rule)',
        ink: 'var(--color-ink)',
        'ink-2': 'var(--color-ink-2)',
        blood: 'var(--color-blood)',
        cap: {
          'light-blue': 'var(--cap-light-blue)',
          red: 'var(--cap-red)',
          gold: 'var(--cap-gold)',
          green: 'var(--cap-green)',
          lavender: 'var(--cap-lavender)',
          gray: 'var(--cap-gray)',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '40px', fontWeight: '600' }],
        section: ['24px', { lineHeight: '30px', fontWeight: '600' }],
        tube: ['20px', { lineHeight: '26px', fontWeight: '700' }],
        body: ['17px', { lineHeight: '23px', fontWeight: '400' }],
        label: ['15px', { lineHeight: '20px', fontWeight: '600' }],
        caption: ['13px', { lineHeight: '18px', fontWeight: '600' }],
      },
      minHeight: { tap: '44px', primary: '60px' },
      minWidth: { tap: '44px' },
      height: { tap: '44px', primary: '60px' },
      width: { tap: '44px' },
    },
  },
} satisfies Config;
