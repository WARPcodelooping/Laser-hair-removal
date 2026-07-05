/**
 * server/db-mem.mjs
 * Dev-хранилище без Postgres: те же функции, что db.mjs, но данные
 * в JSON-файле (server/dev-data.json). Включается, когда нет DATABASE_URL.
 * Для продакшена НЕ предназначено.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVICES, STUDIOS } from '../shared/domain.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, 'dev-data.json');

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ACTIVE = ['booked'];
const DEFAULT_SLOTS = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

let data = {
  clients: [],
  masters: [],
  services: [],
  bookings: [],
  weekly: [], // {master_id, day, working, slots}
  dates: [], // {master_id, d, slots}
};

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

const DEMO_MASTERS = [
  { name: 'Мария', specialty: 'Лазерная эпиляция', studio: 'stv-mira', cats: ['alex', 'diode'] },
  { name: 'Виктория', specialty: 'Косметолог-эстетист', studio: 'stv-mira', cats: ['cosmetology', 'intimate', 'botox'] },
  { name: 'Алина', specialty: 'Массажист', studio: 'stv-mira', cats: ['massage'] },
  { name: 'Екатерина', specialty: 'Лазерная эпиляция, косметология', studio: 'stv-kulakova', cats: ['alex', 'diode', 'cosmetology'] },
  { name: 'Софья', specialty: 'Универсальный мастер', studio: 'bud-oktyabrskaya', cats: ['alex', 'diode', 'cosmetology', 'massage'] },
  { name: 'Дарья', specialty: 'Лазерная эпиляция', studio: 'bud-mkr8', cats: ['diode'] },
  { name: 'Полина', specialty: 'Лазерная эпиляция, ботокс', studio: 'pyat-kirova', cats: ['alex', 'diode', 'botox'] },
  { name: 'Анастасия', specialty: 'Косметолог', studio: 'pyat-pana', cats: ['cosmetology', 'intimate'] },
  { name: 'Ольга', specialty: 'Универсальный мастер', studio: 'mih-lenina', cats: ['alex', 'diode', 'massage'] },
  { name: 'Кристина', specialty: 'Лазерная эпиляция', studio: 'mih-gagarina', cats: ['alex', 'diode'] },
];

export async function initSchema() {
  if (fs.existsSync(FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      return;
    } catch {
      // повреждён — пересоздаём
    }
  }
  // Сид: услуги из домена
  data.services = SERVICES.map((s) => ({
    id: s.id,
    category: s.category,
    grp: s.group ?? null,
    name: s.name,
    note: s.note ?? null,
    price: s.price,
    price_max: s.priceMax ?? null,
    price_from: !!s.priceFrom,
    duration: s.duration,
    active: true,
  }));
  // Сид: демо-мастера + недельное расписание пн–сб
  DEMO_MASTERS.forEach((m, i) => {
    const id = i + 1;
    if (!STUDIOS.some((s) => s.id === m.studio)) return;
    data.masters.push({
      id,
      name: m.name,
      specialty: m.specialty,
      studio_id: m.studio,
      photo_url: null,
      categories: m.cats,
      active: true,
    });
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']) {
      data.weekly.push({ master_id: id, day, working: true, slots: [...DEFAULT_SLOTS] });
    }
  });
  save();
  console.log('[db-mem] dev-хранилище создано с демо-данными:', FILE);
}

// ── Клиенты ───────────────────────────────────────────────────
export async function upsertClient(u) {
  let c = data.clients.find((x) => String(x.id) === String(u.id));
  if (!c) {
    c = {
      id: u.id,
      name: u.first_name || null,
      username: u.username || null,
      phone: null,
      photo_url: u.photo_url || null,
      city: null,
      studio_id: null,
      consent_at: null,
    };
    data.clients.push(c);
  } else {
    if (u.username) c.username = u.username;
    if (u.photo_url) c.photo_url = u.photo_url;
  }
  save();
}

export async function getClient(id) {
  return data.clients.find((x) => String(x.id) === String(id)) || null;
}

export async function updateClient(id, fields) {
  const c = await getClient(id);
  if (!c) return;
  for (const k of ['name', 'phone', 'city', 'studio_id', 'photo_url']) {
    if (fields[k] !== undefined) c[k] = fields[k];
  }
  save();
}

export async function setConsent(id) {
  const c = await getClient(id);
  if (c) {
    c.consent_at = new Date().toISOString();
    save();
  }
}

export async function countVisits(clientId) {
  return data.bookings.filter(
    (b) => String(b.client_id) === String(clientId) && b.status === 'done'
  ).length;
}

// ── Мастера ───────────────────────────────────────────────────
export async function getMasters({ studioId, category, all = false } = {}) {
  return data.masters
    .filter((m) => (all || m.active))
    .filter((m) => (studioId ? m.studio_id === studioId : true))
    .filter((m) => (category ? (m.categories || []).includes(category) : true))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export async function createMaster({ name, specialty, studio_id, photo_url, categories }) {
  const id = Math.max(0, ...data.masters.map((m) => m.id)) + 1;
  const m = { id, name, specialty: specialty || null, studio_id, photo_url: photo_url || null, categories: categories || [], active: true };
  data.masters.push(m);
  save();
  return m;
}

export async function updateMaster(id, fields) {
  const m = data.masters.find((x) => x.id === id);
  if (!m) return;
  for (const k of ['name', 'specialty', 'studio_id', 'photo_url', 'active', 'categories']) {
    if (fields[k] !== undefined) m[k] = fields[k];
  }
  save();
}

// ── Услуги ────────────────────────────────────────────────────
export async function getServices({ all = false } = {}) {
  return data.services.filter((s) => all || s.active);
}

export async function updateService(id, fields) {
  const s = data.services.find((x) => x.id === id);
  if (!s) return;
  for (const k of ['name', 'note', 'price', 'price_max', 'duration', 'active']) {
    if (fields[k] !== undefined) s[k] = fields[k];
  }
  save();
}

// ── Расписание ────────────────────────────────────────────────
export async function getWeeklySchedule(masterId) {
  return data.weekly.filter((w) => w.master_id === masterId);
}

export async function setWeeklyDay(masterId, day, working, slots) {
  let w = data.weekly.find((x) => x.master_id === masterId && x.day === day);
  if (!w) {
    w = { master_id: masterId, day, working, slots: slots || [] };
    data.weekly.push(w);
  } else {
    w.working = working;
    w.slots = slots || [];
  }
  save();
}

export async function getScheduleDates(masterId, fromIso, toIso) {
  return data.dates
    .filter((x) => x.master_id === masterId && x.d >= fromIso && x.d <= toIso)
    .map((x) => ({ d: x.d, slots: x.slots }));
}

export async function setDateSlots(masterId, dateIso, slots) {
  let x = data.dates.find((y) => y.master_id === masterId && y.d === dateIso);
  if (!x) {
    x = { master_id: masterId, d: dateIso, slots: slots || [] };
    data.dates.push(x);
  } else {
    x.slots = slots || [];
  }
  save();
}

function hasPerDate(masterId) {
  const today = new Date().toISOString().slice(0, 10);
  return data.dates.some((x) => x.master_id === masterId && x.d >= today);
}

export async function getOpenDates(masterId, fromIso, toIso) {
  if (hasPerDate(masterId)) {
    return data.dates
      .filter((x) => x.master_id === masterId && (x.slots || []).length && x.d >= fromIso && x.d <= toIso)
      .map((x) => x.d);
  }
  const weekly = await getWeeklySchedule(masterId);
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const workingDows = new Set();
  weekly.forEach((s) => {
    if (s.working && (s.slots || []).length) workingDows.add(map[s.day]);
  });
  const out = [];
  const cur = new Date(fromIso + 'T00:00:00');
  const end = new Date(toIso + 'T00:00:00');
  while (cur <= end) {
    if (workingDows.has(cur.getDay())) out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getDayAvailability(masterId, dateIso) {
  const taken = data.bookings
    .filter((b) => b.master_id === masterId && b.b_date === dateIso && ACTIVE.includes(b.status))
    .map((b) => b.b_time);

  const pd = data.dates.find((x) => x.master_id === masterId && x.d === dateIso);
  if (pd) return { slots: pd.slots || [], taken };
  if (hasPerDate(masterId)) return { slots: [], taken: [] };

  const dow = DOW_KEYS[new Date(dateIso + 'T00:00:00').getDay()];
  const w = data.weekly.find((x) => x.master_id === masterId && x.day === dow);
  if (!w || !w.working) return { slots: [], taken };
  return { slots: w.slots || [], taken };
}

// ── Записи ────────────────────────────────────────────────────
export async function isSlotTaken(masterId, date, time) {
  return data.bookings.some(
    (b) => b.master_id === masterId && b.b_date === date && b.b_time === time && ACTIVE.includes(b.status)
  );
}

function enrich(b) {
  const m = data.masters.find((x) => x.id === b.master_id);
  const s = data.services.find((x) => x.id === b.service_id);
  const c = data.clients.find((x) => String(x.id) === String(b.client_id));
  return {
    ...b,
    date_iso: b.b_date,
    master_name: m?.name || null,
    service_name: s?.name || null,
    client_name: c?.name || null,
    client_phone: c?.phone || null,
    client_username: c?.username || null,
  };
}

export async function createBooking(b) {
  const row = {
    id: b.id,
    client_id: b.client_id,
    master_id: b.master_id,
    service_id: b.service_id,
    studio_id: b.studio_id,
    b_date: b.date,
    b_time: b.time,
    price: b.price,
    discount: b.discount,
    status: 'booked',
    created_at: new Date().toISOString(),
    reminded_24h: false,
    reminded_2h: false,
  };
  data.bookings.push(row);
  save();
  return enrich(row);
}

export async function getClientBookings(clientId) {
  return data.bookings
    .filter((b) => String(b.client_id) === String(clientId))
    .sort((a, b) => (b.b_date + b.b_time).localeCompare(a.b_date + a.b_time))
    .map(enrich);
}

export async function getBooking(id) {
  const b = data.bookings.find((x) => x.id === id);
  return b ? enrich(b) : null;
}

export async function setBookingStatus(id, status) {
  const b = data.bookings.find((x) => x.id === id);
  if (b) {
    b.status = status;
    save();
  }
}

export async function getBookingsByDate(dateIso, { studioId } = {}) {
  return data.bookings
    .filter((b) => b.b_date === dateIso)
    .filter((b) => (studioId ? b.studio_id === studioId : true))
    .sort((a, b) => a.b_time.localeCompare(b.b_time))
    .map(enrich);
}

export async function getDueReminders(hoursAhead, flagColumn) {
  const now = Date.now();
  const horizon = now + hoursAhead * 3600 * 1000;
  return data.bookings
    .filter((b) => {
      if (b.status !== 'booked' || b[flagColumn]) return false;
      const t = new Date(`${b.b_date}T${b.b_time}`).getTime();
      return t >= now && t <= horizon;
    })
    .map(enrich);
}

export async function markReminded(id, flagColumn) {
  const b = data.bookings.find((x) => x.id === id);
  if (b) {
    b[flagColumn] = true;
    save();
  }
}
