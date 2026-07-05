/**
 * server/lib.mjs
 * Сквозные хелперы и middleware (auth, роли, форматтеры).
 */
import { verifyInitData, hasBotToken } from './telegram.mjs';

// Telegram ID администраторов (владелец/менеджеры) — задаются через env.
export const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const isAdmin = (id) => ADMIN_IDS.includes(String(id));

export const newId = () =>
  `bk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const ok = (res, data) => res.json({ success: true, data });

export const fail = (res, code, message, status = 400) =>
  res.status(status).json({ success: false, error: { code, message } });

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const fmtDate = (iso) => {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(
      new Date(iso + 'T00:00:00')
    );
  } catch {
    return iso;
  }
};

/** Авторизация по Telegram initData (заголовок X-Telegram-Init-Data). */
export function auth(req, res, next) {
  const initData = req.get('X-Telegram-Init-Data') || '';
  let user = verifyInitData(initData);

  // Dev-режим без токена: принимаем id из заголовка для локального теста
  if (!user && !hasBotToken()) {
    const devId = req.get('X-Dev-User-Id');
    if (devId) user = { id: Number(devId) || devId, first_name: 'Dev' };
  }

  if (!user || !user.id) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  req.user = user;
  next();
}

export function requireAdmin(req, res, next) {
  if (!isAdmin(req.user.id)) {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  next();
}
