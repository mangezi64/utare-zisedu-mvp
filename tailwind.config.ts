import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        utare: {
          emerald: "#059669",
          gold: "#D97706",
          slate: "#0F172A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
