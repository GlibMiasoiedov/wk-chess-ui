/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // 1) Скоупимо ВСІ стилі лише всередині root контейнера у WP
  important: "#wk-react-root",

  theme: {
    extend: {},
  },

  // 2) Вимикаємо Tailwind preflight, щоб не зносив стилі теми WP
  corePlugins: {
    preflight: false,
  },

  plugins: [],
};
