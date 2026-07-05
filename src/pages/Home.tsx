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

  return (
    <div className="px-5 pt-12">
      <p className="text-xs text-accent-dark">
        {client?.city}
        {studio ? ` · ${studio.address}` : ''}
      </p>
      <h1 className="mt-1 font-head text-2xl font-bold">
        {client?.name ? `Привет, ${client.name.split(' ')[0]}!` : 'Добро пожаловать!'}
      </h1>

      {profileIncomplete && (
        <div className="card mt-5 p-4">
          <p className="font-head font-semibold">Давайте познакомимся</p>
          <p className="mt-0.5 text-xs text-accent-dark">
            Заполняется один раз — для оформления записей
          </p>
          <label className="mt-3 block text-xs font-medium text-accent-dark">Имя</label>
          <input
            className="mt-1 w-full rounded-xl border border-soft bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Анна"
          />
          <label className="mt-3 block text-xs font-medium text-accent-dark">Телефон</label>
          <input
            className="mt-1 w-full rounded-xl border border-soft bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
            type="tel"
            inputMode="tel"
          />
          <button
            className="btn-primary mt-4"
            disabled={saving || !name.trim() || phone.trim().length < 10}
            onClick={saveProfile}
          >
            Сохранить
          </button>
        </div>
      )}

      {next && (
        <div className="mt-5 rounded-card bg-accent p-4 text-white">
          <p className="text-xs text-softer">Ближайшая запись</p>
          <p className="mt-1 font-head font-semibold">{next.service_name}</p>
          <p className="mt-1 text-sm text-softer">
            {new Date(next.date_iso + 'T00:00:00').toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
            , {next.b_time} · {next.master_name}
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          className="card p-4 text-left transition active:scale-[0.98]"
          onClick={() => nav('/services')}
        >
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <p className="mt-2 font-head text-sm font-semibold">Записаться</p>
        </button>
        <button
          className="card p-4 text-left transition active:scale-[0.98]"
          onClick={() => nav('/profile')}
        >
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="mt-2 font-head text-sm font-semibold">Моя скидка</p>
        </button>
      </div>

      {isAdmin && (
        <button className="btn-outline mt-5" onClick={() => nav('/admin')}>
          Панель администратора
        </button>
      )}
    </div>
  );
}
