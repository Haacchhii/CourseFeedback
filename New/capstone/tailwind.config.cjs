module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Enhanced Spacing Scale (8px baseline system)
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
      },

      // Typography Scale
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],     // 10px
        'xs': ['0.75rem', { lineHeight: '1rem' }],           // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],       // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],          // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],           // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],      // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],        // 36px
        '5xl': ['3rem', { lineHeight: '1' }],                // 48px
      },

      // Container Max Widths
      maxWidth: {
        'screen-3xl': '1920px',
      },

      // Enhanced Shadows for Better Depth
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'crimson': '0 4px 14px 0 rgb(122 0 0 / 0.25)',
        'crimson-lg': '0 10px 24px 0 rgb(122 0 0 / 0.35)',
      },

      // Consistent Border Radius
      borderRadius: {
        'card': '0.75rem',    // 12px
        'button': '0.5rem',   // 8px
        'input': '0.5rem',    // 8px
      },

      // Animation Timing
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
}
