/**
 * Набросок админ-панели: записи по дате, мастера (CRUD),
 * услуги (цена/скрытие), окошки расписания по дням для мастера.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api/http';
import { STUDIOS, CATEGORIES } from '../../../shared/domain.js';
import type { Booking, Master, Service, Studio, Category } from '../../types';

type Tab = 'bookings' | 'masters' | 'services' | 'schedule';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('bookings');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-12">
      <div className="flex items-center justify-between px-5">
        <h1 className="font-head text-2xl font-bold">Админка</h1>
        <button className="text-sm text-accent" onClick={() => nav('/')}>
          Выйти
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ['bookings', 'Записи'],
            ['masters', 'Мастера'],
            ['services', 'Услуги'],
            ['schedule', 'Окошки'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pill ${tab === id ? 'pill-active' : 'pill-idle'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5 pb-8 pt-4">
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'masters' && <MastersTab />}
        {tab === 'services' && <ServicesTab />}
        {tab === 'schedule' && <ScheduleTab />}
      </div>
    </div>
  );
}

// ── Записи ────────────────────────────────────────────────────
function BookingsTab() {
  const [date, setDate] = useState(todayIso());
  const [list, setList] = useState<Booking[]>([]);

  const load = () =>
    apiGet<Booking[]>(`/admin/bookings?date=${date}`).then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const setStatus = async (id: string, status: string) => {
    await apiPost(`/admin/bookings/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <input
        type="date"
        className="w-full rounded-xl border border-soft bg-card px-3 py-2.5 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="mt-3 flex flex-col gap-2">
        {list.map((b) => (
          <div key={b.id} className="card p-3">
            <div className="flex items-center justify-between">
              <p className="font-head font-semibold">{b.b_time}</p>
              <span
                className={`rounded-pill px-2 py-0.5 text-[11px] ${
                  b.status === 'booked'
                    ? 'bg-softer text-accent-deep'
                    : b.status === 'done'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                }`}
              >
                {b.status === 'booked' ? 'Активна' : b.status === 'done' ? 'Завершена' : 'Отменена'}
              </span>
            </div>
            <p className="mt-1 text-sm">{b.service_name}</p>
            <p className="text-xs text-accent-dark">
              Мастер: {b.master_name} · {b.price.toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-xs text-accent-dark">
              {b.client_name} {b.client_username ? `@${b.client_username}` : ''} {b.client_phone}
            </p>
            {b.status === 'booked' && (
              <div className="mt-2 flex gap-2">
                <button className="flex-1 rounded-xl bg-softer py-2 text-xs font-medium text-accent-deep" onClick={() => setStatus(b.id, 'done')}>
                  Завершить
                </button>
                <button className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-medium text-red-500" onClick={() => setStatus(b.id, 'cancelled')}>
                  Отменить
                </button>
              </div>
            )}
          </div>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-muted">Записей на эту дату нет</p>}
      </div>
    </div>
  );
}

// ── Мастера ───────────────────────────────────────────────────
function MastersTab() {
  const [list, setList] = useState<Master[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [studioId, setStudioId] = useState((STUDIOS as Studio[])[0].id);
  const [cats, setCats] = useState<string[]>([]);

  const load = () =>
    apiGet<Master[]>('/admin/masters').then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
  }, []);

  const toggleCat = (id: string) =>
    setCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const add = async () => {
    if (!name.trim()) return;
    await apiPost('/admin/masters', { name: name.trim(), specialty, studio_id: studioId, categories: cats });
    setName('');
    setSpecialty('');
    setCats([]);
    setAdding(false);
    load();
  };

  const toggleActive = async (m: Master) => {
    await apiPost(`/admin/masters/${m.id}`, { active: !m.active });
    load();
  };

  return (
    <div className="flex flex-col gap-2">
      {list.map((m) => {
        const studio = (STUDIOS as Studio[]).find((s) => s.id === m.studio_id);
        return (
          <div key={m.id} className={`card p-3 ${m.active ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between">
              <p className="font-head font-semibold">{m.name}</p>
              <button className="text-xs text-accent" onClick={() => toggleActive(m)}>
                {m.active ? 'Скрыть' : 'Вернуть'}
              </button>
            </div>
            {m.specialty && <p className="text-xs text-accent-dark">{m.specialty}</p>}
            <p className="text-xs text-muted">
              {studio ? `${studio.city}, ${studio.address}` : m.studio_id} ·{' '}
              {m.categories
                .map((c) => (CATEGORIES as Category[]).find((x) => x.id === c)?.name || c)
                .join(', ')}
            </p>
          </div>
        );
      })}

      {adding ? (
        <div className="card p-4">
          <input
            className="w-full rounded-xl border border-soft bg-bg px-3 py-2.5 text-sm"
            placeholder="Имя мастера"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="mt-2 w-full rounded-xl border border-soft bg-bg px-3 py-2.5 text-sm"
            placeholder="Специализация (например, «Лазерная эпиляция»)"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <select
            className="mt-2 w-full rounded-xl border border-soft bg-bg px-3 py-2.5 text-sm"
            value={studioId}
            onChange={(e) => setStudioId(e.target.value)}
          >
            {(STUDIOS as Studio[]).map((s) => (
              <option key={s.id} value={s.id}>
                {s.city}, {s.address}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs font-medium text-accent-dark">Категории услуг:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(CATEGORIES as Category[]).map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCat(c.id)}
                className={`pill text-xs ${cats.includes(c.id) ? 'pill-active' : 'pill-idle'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary flex-1 py-2.5" onClick={add}>
              Добавить
            </button>
            <button className="btn-outline flex-1 py-2.5" onClick={() => setAdding(false)}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-outline" onClick={() => setAdding(true)}>
          + Новый мастер
        </button>
      )}
    </div>
  );
}

// ── Услуги ────────────────────────────────────────────────────
function ServicesTab() {
  const [list, setList] = useState<Service[]>([]);
  const [cat, setCat] = useState((CATEGORIES as Category[])[0].id);

  const load = () =>
    apiGet<Service[]>('/admin/services').then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
  }, []);

  const editPrice = async (s: Service) => {
    const raw = prompt(`Новая цена для «${s.name}»`, String(s.price));
    if (!raw) return;
    const price = parseInt(raw, 10);
    if (!Number.isFinite(price) || price <= 0) return;
    await apiPost(`/admin/services/${s.id}`, { price });
    load();
  };

  const toggle = async (s: Service) => {
    await apiPost(`/admin/services/${s.id}`, { active: !s.active });
    load();
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(CATEGORIES as Category[]).map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`pill text-xs ${cat === c.id ? 'pill-active' : 'pill-idle'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {list
          .filter((s) => s.category === cat)
          .map((s) => (
            <div key={s.id} className={`card flex items-center justify-between px-3 py-2.5 ${s.active ? '' : 'opacity-50'}`}>
              <div className="min-w-0">
                <p className="truncate text-sm">{s.name}</p>
                <p className="text-xs text-muted">{s.duration} мин</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button className="font-head text-sm font-bold text-accent" onClick={() => editPrice(s)}>
                  {s.price.toLocaleString('ru-RU')} ₽
                </button>
                <button className="text-xs text-muted" onClick={() => toggle(s)}>
                  {s.active ? 'Скрыть' : 'Вернуть'}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Окошки ────────────────────────────────────────────────────
function ScheduleTab() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [masterId, setMasterId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('10:00');

  useEffect(() => {
    apiGet<Master[]>('/admin/masters').then((r) => {
      if (r.success && r.data) {
        setMasters(r.data);
        if (r.data.length && masterId === null) setMasterId(r.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (masterId === null) return;
    apiGet<{ weekly: unknown; dates: { d: string; slots: string[] }[] }>(
      `/admin/schedule?master=${masterId}&from=${date}&to=${date}`
    ).then((r) => {
      if (r.success && r.data) setSlots(r.data.dates[0]?.slots || []);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId, date]);

  const save = async (next: string[]) => {
    if (masterId === null) return;
    const sorted = [...new Set(next)].sort();
    await apiPost('/admin/schedule/date', { master_id: masterId, date, slots: sorted });
    setSlots(sorted);
  };

  return (
    <div>
      <select
        className="w-full rounded-xl border border-soft bg-card px-3 py-2.5 text-sm"
        value={masterId ?? ''}
        onChange={(e) => setMasterId(Number(e.target.value))}
      >
        {masters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="mt-2 w-full rounded-xl border border-soft bg-card px-3 py-2.5 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <p className="mt-4 text-xs font-medium text-accent-dark">Окошки на день:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((s) => (
          <button
            key={s}
            className="pill pill-idle text-sm"
            onClick={() => save(slots.filter((x) => x !== s))}
            title="Нажмите, чтобы удалить"
          >
            {s} ✕
          </button>
        ))}
        {!slots.length && <p className="text-sm text-muted">Выходной (окошек нет)</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="time"
          className="flex-1 rounded-xl border border-soft bg-card px-3 py-2.5 text-sm"
          value={newSlot}
          onChange={(e) => setNewSlot(e.target.value)}
        />
        <button
          className="rounded-xl bg-accent px-5 text-sm font-medium text-white active:scale-95"
          onClick={() => newSlot && save([...slots, newSlot])}
        >
          Добавить
        </button>
      </div>
      {!masters.length && (
        <p className="mt-6 text-center text-sm text-muted">
          Сначала добавьте мастера во вкладке «Мастера»
        </p>
      )}
    </div>
  );
}
