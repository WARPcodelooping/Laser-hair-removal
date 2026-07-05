/**
 * api/http.ts
 * HTTP-клиент: авторизация через Telegram initData
 * (заголовок X-Telegram-Init-Data, backend проверяет подпись).
 */
import type { ApiResponse } from '../types';

function authHeaders(): Record<string, string> {
  const initData = window.Telegram?.WebApp?.initData || '';
  const headers: Record<string, string> = {};
  if (initData) headers['X-Telegram-Init-Data'] = initData;

  // Локальная разработка без Telegram: dev-id для теста
  if (!initData) {
    let devId = localStorage.getItem('laser_dev_user_id');
    if (!devId) {
      devId = '1';
      localStorage.setItem('laser_dev_user_id', devId);
    }
    headers['X-Dev-User-Id'] = devId;
  }
  return headers;
}

async function parse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return { success: false, error: { code: String(res.status), message: 'Ошибка сети' } };
  }
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, { headers: authHeaders() });
    return parse<T>(res);
  } catch {
    return { success: false, error: { code: 'NETWORK', message: 'Нет соединения с сервером' } };
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body ?? {}),
    });
    return parse<T>(res);
  } catch {
    return { success: false, error: { code: 'NETWORK', message: 'Нет соединения с сервером' } };
  }
}
