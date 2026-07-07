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

interface TgRequestContactResponse {
  responseUnsafe?: { contact?: { phone_number?: string } };
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
  requestContact?: (cb: (ok: boolean, resp?: TgRequestContactResponse) => void) => void;
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

/**
 * Запрашивает номер телефона у Telegram (нативный диалог «Поделиться номером»).
 * Возвращает номер или null (отказ / старый клиент / вне Telegram).
 */
export function requestPhone(): Promise<string | null> {
  return new Promise((resolve) => {
    const tg = getWebApp();
    if (!tg?.requestContact) return resolve(null);
    try {
      tg.requestContact((ok, resp) => {
        const phone = resp?.responseUnsafe?.contact?.phone_number || null;
        resolve(ok && phone ? phone : null);
      });
    } catch {
      resolve(null);
    }
  });
}
