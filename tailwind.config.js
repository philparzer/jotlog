/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "grape": "#E27FE4",
        "dim": "#5B505C",
        "vanta": "#2E2A2D",
        "offwhite": "#F9FCF7",
        "danger": "#FA2E2E"
      },
    }
  }
}

