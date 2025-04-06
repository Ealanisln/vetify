// tailwind.config.ts
import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import type { PluginAPI } from 'tailwindcss/types/config';

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vetify: {
          // Primary palette
          primary: {
            DEFAULT: "#8B6E5C", // Brown from capybara
            light: "#A58D7F",
            dark: "#6A513F",
            50: "#F5F1EE",
            100: "#E8D5C4", // Beige from capybara
            200: "#D9BCA5",
            300: "#C9A386",
            400: "#B98B68",
            500: "#8B6E5C", // Base color
            600: "#6A513F",
            700: "#4D3A2D",
            800: "#32251D",
            900: "#1A130F",
          },
          // Secondary palette
          accent: {
            DEFAULT: "#7FA99B", // Sage green
            light: "#A3C2B8",
            dark: "#5C877B",
            50: "#F0F5F3",
            100: "#E1ECE9",
            200: "#C3D9D3",
            300: "#A3C2B8",
            400: "#7FA99B", // Base color
            500: "#5C877B",
            600: "#496B62",
            700: "#364F48",
            800: "#24342F",
            900: "#121A17",
          },
          // Tertiary & accent colors
          blush: {
            DEFAULT: "#FFB5B5", // Soft pink from tablet
            light: "#FFCDCD",
            dark: "#FF9D9D",
            50: "#FFF5F5",
            100: "#FFEBEB",
            200: "#FFD7D7",
            300: "#FFC3C3",
            400: "#FFB5B5", // Base color
            500: "#FF8787",
            600: "#FF5959",
            700: "#FF2B2B",
            800: "#FD0000",
            900: "#CF0000",
          },
          slate: {
            DEFAULT: "#506D84", // Blue-gray
            light: "#7A92A6",
            dark: "#3A5063",
            50: "#F0F3F6",
            100: "#E1E7EC",
            200: "#C3CFDA",
            300: "#A3B7C7",
            400: "#7A92A6",
            500: "#506D84", // Base color
            600: "#3A5063",
            700: "#2B3A47",
            800: "#1D272F",
            900: "#0E1318",
          },
          // Surface colors
          surface: {
            light: "#FFFFFF",
            muted: "#F6F6F6",
            subtle: "#EFEFEF",
          },
          // Semantic colors
          success: "#4CAF50",
          warning: "#FFC107",
          error: "#F44336",
          info: "#2196F3",
        },
      },
      fontFamily: {
        sans: ["Inter var", "Inter", ...fontFamily.sans],
        display: ["Quicksand", ...fontFamily.sans],
        body: ["DM Sans", ...fontFamily.sans],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        smooth: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-10px)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        slideDown: 'slideDown 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-in',
        fadeIn: 'fadeIn 0.3s ease-in',
        fadeInSlow: 'fadeIn 0.5s ease-in',
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"), 
    require("@tailwindcss/typography"),
    function ({ addUtilities, theme }: PluginAPI) {
      const animationDelayUtilities: Record<string, Record<string, string>> = {};
      [75, 150, 225, 300, 375, 450].forEach(delay => {
        animationDelayUtilities[`.animation-delay-${delay}`] = {
          'animation-delay': `${delay}ms`,
        };
      });
      addUtilities(animationDelayUtilities);
    },
  ],
} satisfies Config;