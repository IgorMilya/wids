import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/UI/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'small-laptop': '1024px',      // Small laptops / compact screens: 1024px – 1280px
        'normal-laptop': '1280px',     // Normal laptops: 1280px – 1440px
        'large-laptop': '1440px',      // Large laptops / desktop monitors: 1440px – 1680px
        'wide-screen': '1680px',       // Wide screens / big monitors: 1680px – 1920px
        'ultra-wide': '1920px',        // Ultra wide screens: 1920px+
      },
      colors: {
        primary: '#edeff4',
        secondary: '#27044b',
        background: '#fafafa',
        error: '#df0f0f',
        ...colors,
      },
    },
  },
  plugins: [],
}

export default config