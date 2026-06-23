import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        farol: {
          verde: "#16a34a",
          amarelo: "#d97706",
          vermelho: "#dc2626",
        },
      },
    },
  },
  plugins: [],
};
export default config;
