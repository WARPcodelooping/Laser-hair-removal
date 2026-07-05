/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Палитра «Розовая пудра»
        bg: '#FDF4F7', // фон приложения
        card: '#FFFFFF', // карточки
        accent: {
          DEFAULT: '#D4537E', // основной акцент (кнопки, активные табы)
          dark: '#993556', // вторичный текст, hover
          deep: '#72243E', // карта лояльности, тёмные блоки
        },
        ink: '#4B1528', // основной текст
        soft: '#F4C0D1', // границы, разделители
        softer: '#FBEAF0', // светлые заливки, текст на акценте
        blush: '#ED93B1', // прогресс, детали на тёмном
        muted: '#C39AA7', // неактивные иконки/текст
      },
      fontFamily: {
        head: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
