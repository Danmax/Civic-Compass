import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17231d",
        cream: "#f8f6f0",
        moss: "#28614b",
        mint: "#dcebe2",
        gold: "#d6a64f",
      },
    },
  },
  plugins: [],
};

export default config;
