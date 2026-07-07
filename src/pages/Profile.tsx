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
        className="flex min-h-[52px] w-full items-center justify-between px-5 py-3.5"
        onClick={() => setOpen(!open)}
      >
        <span className="font-head text-[15px] font-bold">{title}</span>
        <svg
          className={`h-5 w-5 text-accent transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="border-t border-softer px-4 py-3.5">{children}</div>}
    </div>
  );
}

const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

/** Момент записи; время дополняется до HH:MM («9:00» → «09:00»). */
const bookingAt = (b: Booking) =>
  new Date(`${b.date_iso}T${String(b.b_time).padStart(5, '0')}`);

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
  const upcoming = bookings.filter((b) => b.status === 'booked' && bookingAt(b) >= now);
  const past = bookings.filter((b) => b.status !== 'booked' || bookingAt(b) < now);

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
      <div className="anim flex items-center gap-4">
        <span className="rounded-full bg-gradient-to-br from-accent to-blush p-[2.5px]">
          {client?.photo_url ? (
            <img src={client.photo_url} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-softer font-display text-2xl font-bold text-accent-deep">
              {(client?.name || '?').slice(0, 1)}
            </span>
          )}
        </span>
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight">
            {client?.name || 'Гость'}
          </h1>
          <p className="mt-0.5 text-xs text-accent-dark/80">
            {client?.username ? `@${client.username}` : ''}
            {client?.username && client?.phone ? ' · ' : ''}
            {client?.phone || ''}
          </p>
        </div>
      </div>

      {loyalty && (
        <div className="anim d1 relative mt-6 overflow-hidden rounded-card bg-gradient-to-br from-accent-deep via-[#5C1B32] to-ink p-5 text-white shadow-deep">
          {/* декоративные круги и блик */}
          <span className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/[0.07]" />
          <span className="pointer-events-none absolute -left-8 -bottom-16 h-36 w-36 rounded-full bg-blush/10" />
          <span className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blush">
                Карта лояльности
              </p>
              <span className="rounded-full border border-blush/40 px-2.5 py-0.5 text-[11px] font-semibold text-blush">
                {loyalty.title}
              </span>
            </div>
            <p className="mt-3 font-display text-[40px] font-bold leading-none">
              −{loyalty.discount}%
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blush to-soft transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-softer/80">
              {loyalty.next
                ? `До «${loyalty.next.title}» (−${loyalty.next.discount}%) — ещё ${loyalty.toNext} ${
                    loyalty.toNext === 1 ? 'визит' : loyalty.toNext < 5 ? 'визита' : 'визитов'
                  }`
                : 'Максимальный уровень — вы наша звезда!'}
            </p>
          </div>
        </div>
      )}

      <div className="anim d2 mt-6 flex flex-col gap-3">
        <Collapsible title={`Мои записи${upcoming.length ? ` (${upcoming.length})` : ''}`} defaultOpen>
          {upcoming.length === 0 && (
            <p className="py-3 text-center text-sm text-muted">Активных записей нет</p>
          )}
          <div className="flex flex-col gap-2">
            {upcoming.map((b) => (
              <div key={b.id} className="rounded-2xl bg-softer/60 p-3.5">
                <p className="text-sm font-semibold">{b.service_name}</p>
                <p className="mt-1 text-xs text-accent-dark">
                  {fmtDate(b.date_iso)}, {b.b_time} · {b.master_name}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="font-display text-base font-bold text-accent">
                    {b.price.toLocaleString('ru-RU')} ₽
                    {b.discount > 0 && (
                      <span className="ml-1.5 font-body text-xs font-normal text-muted">
                        (−{b.discount}%)
                      </span>
                    )}
                  </span>
                  <button
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-500 transition active:scale-95 active:bg-red-50"
                    onClick={() => cancel(b.id)}
                  >
                    Отменить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title={`Прошедшие${past.length ? ` (${past.length})` : ''}`}>
          {past.length === 0 && (
            <p className="py-3 text-center text-sm text-muted">Пока пусто</p>
          )}
          <div className="flex flex-col gap-2">
            {past.map((b) => (
              <div key={b.id} className="rounded-2xl bg-softer/40 p-3.5 opacity-85">
                <p className="text-sm font-semibold">{b.service_name}</p>
                <p className="mt-1 text-xs text-accent-dark">
                  {fmtDate(b.date_iso)}, {b.b_time} · {b.master_name}
                </p>
                <p className="mt-1.5 text-xs font-medium">
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
