/**
 * Профиль: аватар, имя, tg-юз, телефон, карта лояльности,
 * раскрывающиеся блоки «Мои записи» и «Прошедшие».
 */
import { useEffect, useState, type ReactNode } from 'react';
import { apiGet, apiPost } from '../api/http';
import { useApp } from '../store/app';
import type { Booking } from '../types';

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-4 py-3.5"
        onClick={() => setOpen(!open)}
      >
        <span className="font-head font-semibold">{title}</span>
        <svg
          className={`h-5 w-5 text-accent transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-soft px-4 py-3">{children}</div>}
    </div>
  );
}

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Profile() {
  const { client, loyalty } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);

  const load = () =>
    apiGet<Booking[]>('/bookings/my').then((r) => {
      if (r.success && r.data) setBookings(r.data);
    });

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status === 'booked' && new Date(`${b.date_iso}T${b.b_time}`) >= now
  );
  const past = bookings.filter(
    (b) => b.status !== 'booked' || new Date(`${b.date_iso}T${b.b_time}`) < now
  );

  const cancel = async (id: string) => {
    if (!confirm('Отменить запись?')) return;
    await apiPost(`/bookings/${id}/cancel`);
    load();
  };

  const progress =
    loyalty && loyalty.next
      ? Math.min(100, Math.round((loyalty.visits / loyalty.next.minVisits) * 100))
      : 100;

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center gap-3">
        {client?.photo_url ? (
          <img src={client.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-soft font-head text-lg font-bold text-accent-deep">
            {(client?.name || '?').slice(0, 1)}
          </span>
        )}
        <div>
          <h1 className="font-head text-xl font-bold">{client?.name || 'Гость'}</h1>
          <p className="text-xs text-accent-dark">
            {client?.username ? `@${client.username}` : ''}
            {client?.username && client?.phone ? ' · ' : ''}
            {client?.phone || ''}
          </p>
        </div>
      </div>

      {loyalty && (
        <div className="mt-5 rounded-card bg-accent-deep p-4 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blush">Карта лояльности · {loyalty.title}</p>
            <svg className="h-5 w-5 text-blush" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <p className="mt-1 font-head text-2xl font-bold">Скидка {loyalty.discount}%</p>
          <div className="mt-3 h-1.5 rounded-full bg-accent-dark">
            <div
              className="h-1.5 rounded-full bg-blush transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-blush">
            {loyalty.next
              ? `До «${loyalty.next.title}» (${loyalty.next.discount}%) — ещё ${loyalty.toNext} ${
                  loyalty.toNext === 1 ? 'визит' : loyalty.toNext < 5 ? 'визита' : 'визитов'
                }`
              : 'Максимальный уровень — вы наша звезда!'}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        <Collapsible title={`Мои записи${upcoming.length ? ` (${upcoming.length})` : ''}`} defaultOpen>
          {upcoming.length === 0 && (
            <p className="py-2 text-center text-sm text-muted">Активных записей нет</p>
          )}
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <div key={b.id} className="rounded-xl bg-bg p-3">
                <p className="text-sm font-medium">{b.service_name}</p>
                <p className="mt-0.5 text-xs text-accent-dark">
                  {fmtDate(b.date_iso)}, {b.b_time} · {b.master_name}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-head text-sm font-bold text-accent">
                    {b.price.toLocaleString('ru-RU')} ₽
                    {b.discount > 0 && (
                      <span className="ml-1 text-xs font-normal text-muted">(-{b.discount}%)</span>
                    )}
                  </span>
                  <button className="text-xs text-red-500" onClick={() => cancel(b.id)}>
                    Отменить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title={`Прошедшие${past.length ? ` (${past.length})` : ''}`}>
          {past.length === 0 && (
            <p className="py-2 text-center text-sm text-muted">Пока пусто</p>
          )}
          <div className="flex flex-col gap-2">
            {past.map((b) => (
              <div key={b.id} className="rounded-xl bg-bg p-3 opacity-80">
                <p className="text-sm font-medium">{b.service_name}</p>
                <p className="mt-0.5 text-xs text-accent-dark">
                  {fmtDate(b.date_iso)}, {b.b_time} · {b.master_name}
                </p>
                <p className="mt-1 text-xs">
                  {b.status === 'cancelled' ? (
                    <span className="text-red-400">Отменена</span>
                  ) : b.status === 'done' ? (
                    <span className="text-green-600">Завершена</span>
                  ) : (
                    <span className="text-muted">Прошла</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
