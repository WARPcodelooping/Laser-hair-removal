/**
 * server/db.mjs
 * PostgreSQL: пул, схема, запросы.
 * Расписание мастеров: недельный шаблон (master_schedule) + переопределения
 * по датам (master_schedule_dates) — дата всегда приоритетнее шаблона.
 */
import pg from 'pg';
import { SERVICES } from '../shared/domain.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

const DOW_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// Локальная дата YYYY-MM-DD (toISOString сдвигает день на не-UTC машинах)
const isoLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Активные статусы, занимающие слот
const ACTIVE = ['booked'];

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id BIGINT PRIMARY KEY,
      name TEXT,
      username TEXT,
      phone TEXT,
      photo_url TEXT,
      city TEXT,
      studio_id TEXT,
      consent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS masters (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT,
      studio_id TEXT NOT NULL,
      photo_url TEXT,
      categories JSONB DEFAULT '[]'::jsonb,
      active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      grp TEXT,
      name TEXT NOT NULL,
      note TEXT,
      price INT NOT NULL,
      price_max INT,
      price_from BOOLEAN DEFAULT false,
      duration INT DEFAULT 30,
      active BOOLEAN DEFAULT true
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      client_id BIGINT NOT NULL,
      master_id INT NOT NULL,
      service_id TEXT NOT NULL,
      studio_id TEXT NOT NULL,
      b_date DATE NOT NULL,
      b_time TEXT NOT NULL,
      price INT NOT NULL,
      discount INT DEFAULT 0,
      status TEXT DEFAULT 'booked',
      created_at TIMESTAMPTZ DEFAULT now(),
      reminded_24h BOOLEAN DEFAULT false,
      reminded_2h BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS master_schedule (
      master_id INT NOT NULL,
      day TEXT NOT NULL,
      working BOOLEAN DEFAULT false,
      slots JSONB DEFAULT '[]'::jsonb,
      PRIMARY KEY (master_id, day)
    );

    CREATE TABLE IF NOT EXISTS master_schedule_dates (
      master_id INT NOT NULL,
      d DATE NOT NULL,
      slots JSONB DEFAULT '[]'::jsonb,
      PRIMARY KEY (master_id, d)
    );
  `);

  await seedServices();
}

/** Первичное заполнение услуг из shared/domain.js (только отсутствующие id). */
async function seedServices() {
  for (const s of SERVICES) {
    await pool.query(
      `INSERT INTO services (id, category, grp, name, note, price, price_max, price_from, duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.category, s.group ?? null, s.name, s.note ?? null, s.price, s.priceMax ?? null, !!s.priceFrom, s.duration]
    );
  }
}

// ── Клиенты ───────────────────────────────────────────────────
export async function upsertClient(u) {
  await pool.query(
    `INSERT INTO clients (id, name, username, photo_url)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET
       username = COALESCE(EXCLUDED.username, clients.username),
       photo_url = COALESCE(EXCLUDED.photo_url, clients.photo_url)`,
    [u.id, u.first_name || null, u.username || null, u.photo_url || null]
  );
}

export async function getClient(id) {
  const { rows } = await pool.query(`SELECT * FROM clients WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function updateClient(id, fields) {
  const allowed = ['name', 'phone', 'city', 'studio_id', 'photo_url'];
  const sets = [];
  const vals = [id];
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      vals.push(fields[k]);
      sets.push(`${k} = $${vals.length}`);
    }
  }
  if (!sets.length) return;
  await pool.query(`UPDATE clients SET ${sets.join(', ')} WHERE id = $1`, vals);
}

export async function setConsent(id) {
  await pool.query(`UPDATE clients SET consent_at = now() WHERE id = $1`, [id]);
}

/** Число завершённых визитов клиента (для лояльности). */
export async function countVisits(clientId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM bookings WHERE client_id = $1 AND status = 'done'`,
    [clientId]
  );
  return rows[0].n;
}

// ── Мастера ───────────────────────────────────────────────────
export async function getMasters({ studioId, category, all = false } = {}) {
  const conds = [];
  const vals = [];
  if (!all) conds.push(`active = true`);
  if (studioId) {
    vals.push(studioId);
    conds.push(`studio_id = $${vals.length}`);
  }
  if (category) {
    vals.push(JSON.stringify(category));
    conds.push(`categories @> $${vals.length}::jsonb`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM masters ${where} ORDER BY name`, vals);
  return rows;
}

export async function createMaster({ name, specialty, studio_id, photo_url, categories }) {
  const { rows } = await pool.query(
    `INSERT INTO masters (name, specialty, studio_id, photo_url, categories)
     VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *`,
    [name, specialty || null, studio_id, photo_url || null, JSON.stringify(categories || [])]
  );
  return rows[0];
}

export async function updateMaster(id, fields) {
  const allowed = ['name', 'specialty', 'studio_id', 'photo_url', 'active'];
  const sets = [];
  const vals = [id];
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      vals.push(fields[k]);
      sets.push(`${k} = $${vals.length}`);
    }
  }
  if (fields.categories !== undefined) {
    vals.push(JSON.stringify(fields.categories));
    sets.push(`categories = $${vals.length}::jsonb`);
  }
  if (!sets.length) return;
  await pool.query(`UPDATE masters SET ${sets.join(', ')} WHERE id = $1`, vals);
}

// ── Услуги ────────────────────────────────────────────────────
export async function getServices({ all = false } = {}) {
  const where = all ? '' : `WHERE active = true`;
  const { rows } = await pool.query(`SELECT * FROM services ${where} ORDER BY category, grp, name`);
  return rows;
}

export async function updateService(id, fields) {
  const allowed = ['name', 'note', 'price', 'price_max', 'duration', 'active'];
  const sets = [];
  const vals = [id];
  for (const k of allowed) {
    if (fields[k] !== undefined) {
      vals.push(fields[k]);
      sets.push(`${k} = $${vals.length}`);
    }
  }
  if (!sets.length) return;
  await pool.query(`UPDATE services SET ${sets.join(', ')} WHERE id = $1`, vals);
}

// ── Расписание мастера ────────────────────────────────────────
export async function getWeeklySchedule(masterId) {
  const { rows } = await pool.query(
    `SELECT day, working, slots FROM master_schedule WHERE master_id = $1`,
    [masterId]
  );
  return rows;
}

export async function setWeeklyDay(masterId, day, working, slots) {
  await pool.query(
    `INSERT INTO master_schedule (master_id, day, working, slots)
     VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (master_id, day) DO UPDATE SET working = $3, slots = $4::jsonb`,
    [masterId, day, working, JSON.stringify(slots || [])]
  );
}

export async function getScheduleDates(masterId, fromIso, toIso) {
  const { rows } = await pool.query(
    `SELECT to_char(d, 'YYYY-MM-DD') AS d, slots FROM master_schedule_dates
      WHERE master_id = $1 AND d BETWEEN $2 AND $3 ORDER BY d`,
    [masterId, fromIso, toIso]
  );
  return rows;
}

export async function setDateSlots(masterId, dateIso, slots) {
  await pool.query(
    `INSERT INTO master_schedule_dates (master_id, d, slots)
     VALUES ($1,$2,$3::jsonb)
     ON CONFLICT (master_id, d) DO UPDATE SET slots = $3::jsonb`,
    [masterId, dateIso, JSON.stringify(slots || [])]
  );
}

async function hasPerDateSchedule(masterId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM master_schedule_dates WHERE master_id = $1 AND d >= CURRENT_DATE LIMIT 1`,
    [masterId]
  );
  return rows.length > 0;
}

/** Открытые даты мастера в диапазоне (для подсветки календаря). */
export async function getOpenDates(masterId, fromIso, toIso) {
  if (await hasPerDateSchedule(masterId)) {
    const { rows } = await pool.query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS d FROM master_schedule_dates
        WHERE master_id = $1 AND jsonb_array_length(slots) > 0 AND d BETWEEN $2 AND $3`,
      [masterId, fromIso, toIso]
    );
    return rows.map((r) => r.d);
  }
  // Фолбэк: недельный шаблон
  const sched = await getWeeklySchedule(masterId);
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const workingDows = new Set();
  sched.forEach((s) => {
    if (s.working && (s.slots || []).length) workingDows.add(map[s.day]);
  });
  const out = [];
  const cur = new Date(fromIso + 'T00:00:00');
  const end = new Date(toIso + 'T00:00:00');
  while (cur <= end) {
    if (workingDows.has(cur.getDay())) out.push(isoLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Доступные слоты мастера на дату (минус занятые записи). */
export async function getDayAvailability(masterId, dateIso) {
  const { rows: takenRows } = await pool.query(
    `SELECT b_time FROM bookings
      WHERE master_id = $1 AND b_date = $2 AND status = ANY($3)`,
    [masterId, dateIso, ACTIVE]
  );
  const taken = takenRows.map((t) => t.b_time);

  // 1) Расписание по конкретной дате — приоритет
  const { rows: pd } = await pool.query(
    `SELECT slots FROM master_schedule_dates WHERE master_id = $1 AND d = $2`,
    [masterId, dateIso]
  );
  if (pd[0]) return { slots: pd[0].slots || [], taken };

  // 2) Режим «по датам» активен, но этой даты нет — закрыто
  if (await hasPerDateSchedule(masterId)) return { slots: [], taken: [] };

  // 3) Фолбэк: недельный шаблон
  const dow = DOW_KEYS[new Date(dateIso + 'T00:00:00').getDay()];
  const { rows } = await pool.query(
    `SELECT working, slots FROM master_schedule WHERE master_id = $1 AND day = $2`,
    [masterId, dow]
  );
  const row = rows[0];
  if (!row || !row.working) return { slots: [], taken };
  return { slots: row.slots || [], taken };
}

// ── Записи ────────────────────────────────────────────────────
export async function isSlotTaken(masterId, date, time) {
  const { rows } = await pool.query(
    `SELECT 1 FROM bookings
      WHERE master_id = $1 AND b_date = $2 AND b_time = $3 AND status = ANY($4) LIMIT 1`,
    [masterId, date, time, ACTIVE]
  );
  return rows.length > 0;
}

export async function createBooking(b) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (id, client_id, master_id, service_id, studio_id, b_date, b_time, price, discount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *, to_char(b_date, 'YYYY-MM-DD') AS date_iso`,
    [b.id, b.client_id, b.master_id, b.service_id, b.studio_id, b.date, b.time, b.price, b.discount]
  );
  return rows[0];
}

export async function getClientBookings(clientId) {
  const { rows } = await pool.query(
    `SELECT b.*, to_char(b.b_date, 'YYYY-MM-DD') AS date_iso,
            m.name AS master_name, s.name AS service_name
       FROM bookings b
       LEFT JOIN masters m ON m.id = b.master_id
       LEFT JOIN services s ON s.id = b.service_id
      WHERE b.client_id = $1
      ORDER BY b.b_date DESC, b.b_time DESC`,
    [clientId]
  );
  return rows;
}

export async function getBooking(id) {
  const { rows } = await pool.query(`SELECT *, to_char(b_date,'YYYY-MM-DD') AS date_iso FROM bookings WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function setBookingStatus(id, status) {
  await pool.query(`UPDATE bookings SET status = $2 WHERE id = $1`, [id, status]);
}

export async function getBookingsByDate(dateIso, { studioId } = {}) {
  const vals = [dateIso];
  let cond = `b.b_date = $1`;
  if (studioId) {
    vals.push(studioId);
    cond += ` AND b.studio_id = $${vals.length}`;
  }
  const { rows } = await pool.query(
    `SELECT b.*, to_char(b.b_date, 'YYYY-MM-DD') AS date_iso,
            m.name AS master_name, s.name AS service_name,
            c.name AS client_name, c.phone AS client_phone, c.username AS client_username
       FROM bookings b
       LEFT JOIN masters m ON m.id = b.master_id
       LEFT JOIN services s ON s.id = b.service_id
       LEFT JOIN clients c ON c.id = b.client_id
      WHERE ${cond}
      ORDER BY b.b_time`,
    vals
  );
  return rows;
}

/** Записи, которым пора отправить напоминание. */
export async function getDueReminders(hoursAhead, flagColumn) {
  const { rows } = await pool.query(
    `SELECT b.*, to_char(b.b_date, 'YYYY-MM-DD') AS date_iso,
            m.name AS master_name, s.name AS service_name
       FROM bookings b
       LEFT JOIN masters m ON m.id = b.master_id
       LEFT JOIN services s ON s.id = b.service_id
      WHERE b.status = 'booked' AND b.${flagColumn} = false
        AND (b.b_date + b.b_time::time) BETWEEN now() AND now() + ($1 || ' hours')::interval`,
    [hoursAhead]
  );
  return rows;
}

export async function markReminded(id, flagColumn) {
  await pool.query(`UPDATE bookings SET ${flagColumn} = true WHERE id = $1`, [id]);
}
