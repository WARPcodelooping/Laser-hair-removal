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
        gold: '#D9A86C', // премиальные детали на тёмном
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        head: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(114, 36, 62, 0.04), 0 10px 30px -14px rgba(178, 58, 102, 0.22)',
        'card-lift': '0 2px 4px rgba(114, 36, 62, 0.05), 0 16px 40px -16px rgba(178, 58, 102, 0.32)',
        btn: '0 10px 24px -10px rgba(212, 83, 126, 0.65)',
        dock: '0 6px 32px -8px rgba(114, 36, 62, 0.28)',
        deep: '0 20px 44px -18px rgba(75, 21, 40, 0.55)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        pop: {
          from: { opacity: '0', transform: 'scale(0.86)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        ripple: {
          from: { transform: 'scale(0.6)', opacity: '0.7' },
          to: { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(240%)' },
        },
      },
      animation: {
        rise: 'rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        pop: 'pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        ripple: 'ripple 1.8s ease-out infinite',
        shimmer: 'shimmer 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
