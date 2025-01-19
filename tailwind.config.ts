import type { Config } from "tailwindcss";

export default {
  darkMode: 'class', // Añade esta línea
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modo claro
        brown: '#8B6E5C',
        beige: '#E8D5C4',
        sage: '#7FA99B',
        pink: '#FFB5B5',
        blueGray: '#506D84',
        // Modo oscuro
        brownD: '#463832',
        beigeD: '#2C2420',
        sageD: '#2C3B37',
        grayD: '#121212',
        pinkD: '#8B4D4D',
        blueGrayD: '#2B3A47',
      },
    },
  },
  plugins: [],
} satisfies Config;