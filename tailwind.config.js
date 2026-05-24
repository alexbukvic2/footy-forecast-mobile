/** @type {import('tailwindcss').Config} */
// fontFamily omitted — custom fonts not loaded yet. Add back when expo-google-fonts is wired.
const { colors, fontSize, borderRadius, spacing, boxShadow } =
  require('./docs/designs/sign-in/tailwind.extend');

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: { colors, fontSize, borderRadius, spacing, boxShadow },
  },
  plugins: [],
};
