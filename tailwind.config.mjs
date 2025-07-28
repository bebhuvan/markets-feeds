/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        text: {
          DEFAULT: 'hsl(var(--text))',
          light: 'hsl(var(--text-light))',
          subtle: 'hsl(var(--text-subtle))'
        },
        link: 'hsl(var(--link))',
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        markets: '#3b82f6',
        macro: '#8b5cf6', 
        research: '#f59e0b',
        technology: '#06b6d4',
        aggregators: '#ec4899',
        newsletters: '#84cc16',
        'non-money': '#f97316',
        policy: '#10b981',
        filings: '#6366f1',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))'
      },
      maxWidth: {
        'content': '800px',
        'wide': '1200px'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif']
      }
    }
  },
  plugins: []
}