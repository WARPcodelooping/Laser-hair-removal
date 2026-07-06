/**
 * Главная: приветствие, дозаполнение профиля (имя/телефон — один раз),
 * ближайшая запись, быстрые действия.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/http';
import { useApp } from '../store/app';
import { getTelegramUser } from '../services/telegram';
import { STUDIOS } from '../../shared/domain.js';
import type { Booking, Studio, Client, Loyalty } from '../types';

export default function Home() {
  const { client, setMe, isAdmin } = useApp();
  const nav = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Дозаполнение профиля
  const tgUser = getTelegramUser();
  const [name, setName] = useState(client?.name || tgUser?.first_name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [saving, setSaving] = useState(false);

  const profileIncomplete = !client?.name || !client?.phone;

  const studio = useMemo(
    () => (STUDIOS as Studio[]).find((s) => s.id === client?.studio_id),
    [client?.studio_id]
  );

  useEffect(() => {
    apiGet<Booking[]>('/bookings/my').then((r) => {
      if (r.success && r.data) setBookings(r.data);
    });
  }, []);

  const next = bookings.find(
    (b) => b.status === 'booked' && new Date(`${b.date_iso}T${b.b_time}`) > new Date()
  );

  const saveProfile = async () => {
    if (!name.trim() || phone.trim().length < 10) return;
    setSaving(true);
    await apiPost('/me', {
      name: name.trim(),
      phone: phone.trim(),
      photo_url: tgUser?.photo_url || undefined,
    });
    const res = await apiGet<{ client: Client; loyalty: Loyalty; isAdmin: boolean }>('/me');
    if (res.success && res.data) setMe(res.data.client, res.data.loyalty, res.data.isAdmin);
    setSaving(false);
  };

  const nextDate = next
    ? new Date(next.date_iso + 'T00:00:00')
    : null;

  return (
    <div className="px-5 pt-12">
      <header className="anim">
        <p className="eyebrow flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {client?.city}
          {studio ? ` · ${studio.address}` : ''}
        </p>
        <h1 className="mt-2 font-display text-[34px] font-semibold leading-[1.05] tracking-tight">
          {client?.name ? (
            <>
              Привет,{' '}
              <span className="italic text-accent">{client.name.split(' ')[0]}</span>
            </>
          ) : (
            'Добро пожаловать'
          )}
        </h1>
        <p className="mt-1.5 text-sm text-accent-dark/80">Гладкая кожа начинается здесь</p>
      </header>

      {profileIncomplete && (
        <div className="card anim d1 mt-6 p-5">
          <p className="font-head text-[15px] font-bold">Давайте познакомимся</p>
          <p className="mt-1 text-xs leading-relaxed text-accent-dark/80">
            Заполняется один раз — для оформления записей
          </p>
          <label className="mt-4 block text-xs font-semibold text-accent-dark">Имя</label>
          <input
            className="input mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Анна"
            autoComplete="name"
          />
          <label className="mt-3 block text-xs font-semibold text-accent-dark">Телефон</label>
          <input
            className="input mt-1.5"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
          <button
            className="btn-primary mt-5"
            disabled={saving || !name.trim() || phone.trim().length < 10}
            onClick={saveProfile}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      )}

      {next && nextDate && (
        <div className="anim d1 relative mt-6 overflow-hidden rounded-card bg-gradient-to-br from-accent via-accent-dark to-accent-deep p-5 text-white shadow-deep">
          {/* декоративные круги */}
          <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
          <span className="pointer-events-none absolute -right-2 top-16 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blush">
                Ближайший визит
              </p>
              <p className="mt-2 font-head text-lg font-bold leading-snug">{next.service_name}</p>
              <p className="mt-1.5 text-[13px] text-softer/90">
                {next.b_time} · {next.master_name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">
              <span className="font-display text-[28px] font-bold leading-none">
                {nextDate.getDate()}
              </span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-softer">
                {nextDate.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
              </span>
            </div>
          </div>
        </div>
      )}

      <button
        className="anim d2 group relative mt-6 block w-full overflow-hidden rounded-card bg-gradient-to-br from-accent to-accent-dark p-5 text-left text-white shadow-deep transition active:scale-[0.98]"
        onClick={() => nav('/services')}
      >
        <span className="pointer-events-none absolute -left-8 -bottom-12 h-36 w-36 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-12 -top-10 h-24 w-24 rounded-full bg-white/10" />
        <span className="relative flex items-center justify-between">
          <span>
            <span className="block font-display text-2xl font-semibold">Записаться</span>
            <span className="mt-1 block text-[13px] text-softer/90">
              Выбрать процедуру, мастера и время
            </span>
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition group-active:translate-x-1">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </span>
      </button>

      <button
        className="card anim d3 mt-3 flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.98]"
        onClick={() => nav('/profile')}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-softer to-soft/60">
          <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block font-head text-[15px] font-bold">Моя скидка</span>
          <span className="mt-0.5 block text-xs text-accent-dark/80">
            Карта лояльности и история визитов
          </span>
        </span>
        <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {isAdmin && (
        <button className="btn-outline anim d4 mt-6" onClick={() => nav('/admin')}>
          Панель администратора
        </button>
      )}
    </div>
  );
}
