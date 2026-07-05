/**
 * server/index.mjs
 * Express: API мини-аппа + статика фронтенда + Telegram webhook + напоминания.
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Без DATABASE_URL используется dev-хранилище в JSON (db-mem.mjs)
const db = process.env.DATABASE_URL
  ? await import('./db.mjs')
  : await import('./db-mem.mjs');
if (!process.env.DATABASE_URL) {
  console.log('[server] DATABASE_URL не задан — работаю на dev-хранилище (db-mem)');
}
import { auth, requireAdmin, isAdmin, ADMIN_IDS, ok, fail, newId, escapeHtml, fmtDate } from './lib.mjs';
import { sendMessage, sendWelcome, setWebhook, WEBHOOK_SECRET, hasBotToken } from './telegram.mjs';
import { STUDIOS, CATEGORIES, loyaltyForVisits } from '../shared/domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS: фронтенд живёт на GitHub Pages, API — здесь (Railway)
const ALLOWED_ORIGINS = ['https://warpcodelooping.github.io'];
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Telegram-Init-Data, X-Dev-User-Id');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 8080;

// ── Публичные справочники ─────────────────────────────────────
app.get('/api/config', (_req, res) =>
  ok(res, { studios: STUDIOS, categories: CATEGORIES })
);

// ── Профиль клиента ───────────────────────────────────────────
app.post('/api/consent', auth, async (req, res) => {
  await db.upsertClient(req.user);
  await db.setConsent(req.user.id);
  ok(res, { consent: true });
});

app.get('/api/me', auth, async (req, res) => {
  await db.upsertClient(req.user);
  const client = await db.getClient(req.user.id);
  const visits = await db.countVisits(req.user.id);
  ok(res, {
    client,
    loyalty: loyaltyForVisits(visits),
    isAdmin: isAdmin(req.user.id),
  });
});

app.post('/api/me', auth, async (req, res) => {
  const { name, phone, city, studio_id, photo_url } = req.body || {};
  await db.upsertClient(req.user);
  await db.updateClient(req.user.id, { name, phone, city, studio_id, photo_url });
  ok(res, await db.getClient(req.user.id));
});

// ── Каталог ───────────────────────────────────────────────────
app.get('/api/services', auth, async (_req, res) => {
  ok(res, await db.getServices());
});

app.get('/api/masters', auth, async (req, res) => {
  const { studio, category } = req.query;
  ok(res, await db.getMasters({ studioId: studio, category }));
});

// ── Доступность ───────────────────────────────────────────────
app.get('/api/availability', auth, async (req, res) => {
  const { master, from, to } = req.query;
  if (!master || !from || !to) return fail(res, 'BAD_REQUEST', 'master, from, to обязательны');
  ok(res, await db.getOpenDates(Number(master), from, to));
});

app.get('/api/availability/day', auth, async (req, res) => {
  const { master, date } = req.query;
  if (!master || !date) return fail(res, 'BAD_REQUEST', 'master и date обязательны');
  ok(res, await db.getDayAvailability(Number(master), date));
});

// ── Записи клиента ────────────────────────────────────────────
app.post('/api/bookings', auth, async (req, res) => {
  const { service_id, master_id, studio_id, date, time } = req.body || {};
  if (!service_id || !master_id || !studio_id || !date || !time) {
    return fail(res, 'BAD_REQUEST', 'Не все поля заполнены');
  }

  const services = await db.getServices();
  const svc = services.find((s) => s.id === service_id);
  if (!svc) return fail(res, 'NOT_FOUND', 'Услуга не найдена', 404);

  // Слот ещё свободен?
  const { slots } = await db.getDayAvailability(Number(master_id), date);
  if (!slots.includes(time) || (await db.isSlotTaken(Number(master_id), date, time))) {
    return fail(res, 'SLOT_TAKEN', 'Это время уже занято — выберите другое', 409);
  }

  // Скидка по лояльности
  const visits = await db.countVisits(req.user.id);
  const loyalty = loyaltyForVisits(visits);
  const price = Math.round(svc.price * (1 - loyalty.discount / 100));

  const booking = await db.createBooking({
    id: newId(),
    client_id: req.user.id,
    master_id: Number(master_id),
    service_id,
    studio_id,
    date,
    time,
    price,
    discount: loyalty.discount,
  });

  // Уведомления: клиенту и админам
  const studio = STUDIOS.find((s) => s.id === studio_id);
  const masters = await db.getMasters({ all: true });
  const master = masters.find((m) => m.id === Number(master_id));
  const place = studio ? `${studio.city}, ${studio.address}` : '';
  sendMessage(
    req.user.id,
    `✅ <b>Вы записаны!</b>\n\n${escapeHtml(svc.name)}\n` +
      `📅 ${fmtDate(date)}, ${time}\n📍 ${escapeHtml(place)}\n` +
      `Мастер: ${escapeHtml(master?.name || '')}\n` +
      `Стоимость: ${price.toLocaleString('ru-RU')} ₽` +
      (loyalty.discount ? ` (скидка ${loyalty.discount}%)` : '')
  );
  const client = await db.getClient(req.user.id);
  for (const adminId of ADMIN_IDS) {
    sendMessage(
      adminId,
      `🆕 <b>Новая запись</b>\n\n${escapeHtml(svc.name)}\n` +
        `📅 ${fmtDate(date)}, ${time}\n📍 ${escapeHtml(place)}\n` +
        `Мастер: ${escapeHtml(master?.name || '')}\n` +
        `Клиент: ${escapeHtml(client?.name || '')} ` +
        (client?.username ? `@${escapeHtml(client.username)} ` : '') +
        (client?.phone ? `\n📞 ${escapeHtml(client.phone)}` : '')
    );
  }

  ok(res, booking);
});

app.get('/api/bookings/my', auth, async (req, res) => {
  ok(res, await db.getClientBookings(req.user.id));
});

app.post('/api/bookings/:id/cancel', auth, async (req, res) => {
  const booking = await db.getBooking(req.params.id);
  if (!booking) return fail(res, 'NOT_FOUND', 'Запись не найдена', 404);
  if (String(booking.client_id) !== String(req.user.id) && !isAdmin(req.user.id)) {
    return fail(res, 'FORBIDDEN', 'Нет доступа', 403);
  }
  if (booking.status !== 'booked') return fail(res, 'BAD_STATE', 'Запись уже неактивна');
  await db.setBookingStatus(booking.id, 'cancelled');

  for (const adminId of ADMIN_IDS) {
    sendMessage(adminId, `❌ Отмена записи: ${fmtDate(booking.date_iso)}, ${booking.b_time}`);
  }
  ok(res, { cancelled: true });
});

// ── Админка ───────────────────────────────────────────────────
app.get('/api/admin/bookings', auth, requireAdmin, async (req, res) => {
  const { date, studio } = req.query;
  if (!date) return fail(res, 'BAD_REQUEST', 'date обязателен');
  ok(res, await db.getBookingsByDate(date, { studioId: studio }));
});

app.post('/api/admin/bookings/:id/status', auth, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  if (!['booked', 'done', 'cancelled'].includes(status)) {
    return fail(res, 'BAD_REQUEST', 'Некорректный статус');
  }
  await db.setBookingStatus(req.params.id, status);
  ok(res, { updated: true });
});

app.get('/api/admin/masters', auth, requireAdmin, async (_req, res) => {
  ok(res, await db.getMasters({ all: true }));
});

app.post('/api/admin/masters', auth, requireAdmin, async (req, res) => {
  const { name, specialty, studio_id, categories } = req.body || {};
  if (!name || !studio_id) return fail(res, 'BAD_REQUEST', 'Имя и студия обязательны');
  ok(res, await db.createMaster({ name, specialty, studio_id, categories }));
});

app.post('/api/admin/masters/:id', auth, requireAdmin, async (req, res) => {
  await db.updateMaster(Number(req.params.id), req.body || {});
  ok(res, { updated: true });
});

app.get('/api/admin/services', auth, requireAdmin, async (_req, res) => {
  ok(res, await db.getServices({ all: true }));
});

app.post('/api/admin/services/:id', auth, requireAdmin, async (req, res) => {
  await db.updateService(req.params.id, req.body || {});
  ok(res, { updated: true });
});

app.get('/api/admin/schedule', auth, requireAdmin, async (req, res) => {
  const { master, from, to } = req.query;
  if (!master || !from || !to) return fail(res, 'BAD_REQUEST', 'master, from, to обязательны');
  ok(res, {
    weekly: await db.getWeeklySchedule(Number(master)),
    dates: await db.getScheduleDates(Number(master), from, to),
  });
});

app.post('/api/admin/schedule/date', auth, requireAdmin, async (req, res) => {
  const { master_id, date, slots } = req.body || {};
  if (!master_id || !date) return fail(res, 'BAD_REQUEST', 'master_id и date обязательны');
  await db.setDateSlots(Number(master_id), date, slots || []);
  ok(res, { updated: true });
});

app.post('/api/admin/schedule/weekly', auth, requireAdmin, async (req, res) => {
  const { master_id, day, working, slots } = req.body || {};
  if (!master_id || !day) return fail(res, 'BAD_REQUEST', 'master_id и day обязательны');
  await db.setWeeklyDay(Number(master_id), day, !!working, slots || []);
  ok(res, { updated: true });
});

// ── Telegram webhook ──────────────────────────────────────────
app.post('/api/tg/webhook', async (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }
  const msg = req.body?.message;
  if (msg?.text?.startsWith('/start')) sendWelcome(msg.chat.id);
  res.sendStatus(200);
});

// ── Напоминания (каждые 10 минут) ─────────────────────────────
async function runReminders() {
  try {
    for (const [hours, flag] of [[24, 'reminded_24h'], [2, 'reminded_2h']]) {
      const due = await db.getDueReminders(hours, flag);
      for (const b of due) {
        await sendMessage(
          b.client_id,
          `⏰ <b>Напоминание о записи</b>\n\n${escapeHtml(b.service_name || '')}\n` +
            `📅 ${fmtDate(b.date_iso)}, ${b.b_time}\nМастер: ${escapeHtml(b.master_name || '')}`
        );
        await db.markReminded(b.id, flag);
      }
    }
  } catch (e) {
    console.warn('[reminders] error:', e.message);
  }
}

// ── Статика фронтенда ─────────────────────────────────────────
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

// ── Старт ─────────────────────────────────────────────────────
db.initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
    if (hasBotToken()) setWebhook();
    setInterval(runReminders, 10 * 60 * 1000);
  })
  .catch((e) => {
    console.error('[server] init failed:', e);
    process.exit(1);
  });
