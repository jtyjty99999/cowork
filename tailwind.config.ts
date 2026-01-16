import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: '#f8f8f8',
        tertiary: '#f0f0f0',
        border: '#e0e0e0',
        'text-primary': '#1a1a1a',
        'text-secondary': '#666666',
        'text-tertiary': '#999999',
        accent: '#d97757',
        'accent-hover': '#c56647',
        success: '#4caf50',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
