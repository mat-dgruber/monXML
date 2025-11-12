 /** @type {import('tailwindcss').Config} */
export default {
   content: ["./src/**/*.{html,ts}"],
   theme: {
     extend: {
      colors: {
        'primary': '#859b48',
        'primary-light': '#c4c7b6',
        'primary-dark': '#1d361f',
        'neutral': '#c4c7b6',
        'accent': '#dfc8b6',
        'background': '#1d361f',
        'text': '#e5e5df',
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