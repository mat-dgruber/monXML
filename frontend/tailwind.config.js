/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Cores Principais
        'primary': '#5d8a8c', // Petróleo
        'secondary': '#d8704c', // Laranja
        'brown': '#593e2b', // Marrom
        'beige': '#f3e4c9', // Bege

        // Neutros
        'background': '#fbf9f6', // Fundo
        'text': '#3a3a3a', // Texto

        // Destaque
        'accent': '#8a9a8b', // Verde Sálvia

        // Funcionais
        'success': '#5a9261',
        'error': '#d15c5c',

        // Compatibilidade (se necessário manter nomes antigos, mapeie para os novos)
        // 'primary-light': '...',
        // 'primary-dark': '...',
        // 'neutral': '...',
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
