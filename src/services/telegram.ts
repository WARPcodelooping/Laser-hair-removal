/**
 * services/telegram.ts
 * Обёртка над Telegram WebApp SDK: инициализация, данные пользователя.
 */
interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TgWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: { user?: TgUser };
  colorScheme: 'light' | 'dark';
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function getWebApp(): TgWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getWebApp();
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#FDF4F7');
  tg.setBackgroundColor?.('#FDF4F7');
}

export function getTelegramUser(): TgUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

export function closeApp() {
  const tg = getWebApp();
  if (tg) tg.close();
  else window.close();
}
