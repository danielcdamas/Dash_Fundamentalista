/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta sóbria para um dashboard financeiro limpo
        positive: '#16a34a', // verde - alta
        negative: '#dc2626', // vermelho - baixa
      },
    },
  },
  plugins: [],
}
