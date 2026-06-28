/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16242E",
        paper: "#F6F7F5",
        paperdim: "#ECEEEA",
        slate: {
          DEFAULT: "#5B7A8C",
          light: "#8FA6B3",
          dark: "#3E5562",
        },
        risk: {
          low: "#3F8F6B",
          lowbg: "#E4F0EA",
          medium: "#C8862E",
          mediumbg: "#F6EADA",
          high: "#B0473F",
          highbg: "#F3E0DD",
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
