 /** @type {import('tailwindcss').Config} */
export default {
   content: ["./src/**/*.{html,ts}"],
   theme: {
     extend: {
      colors: {
        'primary': '#F0A040',
        'primary-light': '#DA9B5B',
        'primary-dark': '#593E2B',
        'neutral': '#B0B0B0',
        'accent': '#D8704C',
        'background': '#2C3E40',
        'text': '#FBF9F6',
      },
    },
   },
   plugins: [
    function ({ addBase, theme }) {
      addBase({
        'h1, h2, h3, h4, h5, h6': {
          color: theme('colors.text'),
        },
        'a': {
          color: theme('colors.accent'),
          transition: 'color 0.3s ease',
        },
        'a:hover': {
          color: theme('colors.primary'),
        },
      });
    },
  ],
 }