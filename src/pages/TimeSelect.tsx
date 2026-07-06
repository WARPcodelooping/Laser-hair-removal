/**
 * Выбор даты (календарь месяца с открытыми днями) и свободного времени,
 * подтверждение записи.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/http';
import { useApp } from '../store/app';
import type { Booking } from '../types';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function TimeSelect() {
  const nav = useNavigate();
  const { client, service, master, resetBooking } = useApp();

  const today = useMemo(() => new Date(new Date().toDateString()), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [openDates, setOpenDates] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!service || !master) nav('/services', { replace: true });
  }, [service, master, nav]);

  // Открытые даты месяца
  useEffect(() => {
    if (!master) return;
    const from = iso(new Date(Math.max(+month, +today)));
    const to = iso(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    apiGet<string[]>(`/availability?master=${master.id}&from=${from}&to=${to}`).then((r) => {
      setOpenDates(new Set(r.success && r.data ? r.data : []));
    });
  }, [master, month, today]);

  // Слоты выбранного дня
  useEffect(() => {
    if (!master || !date) return;
    setTime(null);
    apiGet<{ slots: string[]; taken: string[] }>(
      `/availability/day?master=${master.id}&date=${date}`
    ).then((r) => {
      if (r.success && r.data) {
        setSlots(r.data.slots);
        setTaken(new Set(r.data.taken));
      }
    });
  }, [master, date]);

  if (!service || !master) return null;

  // Сетка календаря
  const firstDow = (month.getDay() + 6) % 7; // Пн = 0
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const submit = async () => {
    if (!date || !time) return;
    setBusy(true);
    setError('');
    const res = await apiPost<Booking>('/bookings', {
      service_id: service.id,
      master_id: master.id,
      studio_id: client?.studio_id,
      date,
      time,
    });
    setBusy(false);
    if (res.success && res.data) {
      setDone(res.data);
    } else {
      setError(res.error?.message || 'Не получилось записаться. Попробуйте другое время.');
      if (res.error?.code === 'SLOT_TAKEN' && master && date) {
        const r = await apiGet<{ slots: string[]; taken: string[] }>(
          `/availability/day?master=${master.id}&date=${date}`
        );
        if (r.success && r.data) setTaken(new Set(r.data.taken));
      }
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 pb-10">
        <div className="animate-pop relative flex h-24 w-24 items-center justify-center">
          <span className="animate-ripple absolute inset-0 rounded-full bg-accent/20" />
          <span className="absolute -inset-3 rounded-full border border-soft/40" />
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark shadow-btn">
            <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>
        </div>
        <h1 className="anim d1 mt-7 text-center font-display text-[34px] font-semibold">
          Вы записаны!
        </h1>
        <div className="card anim d2 mt-6 w-full p-5">
          <p className="font-head text-[15px] font-bold">{service.name}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-accent-dark">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {new Date(done.date_iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, {done.b_time}
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-accent-dark">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {master.name}
          </div>
          <p className="mt-3 text-xs text-muted">Напомним за сутки и за 2 часа до визита</p>
        </div>
        <button
          className="btn-primary anim d3 mt-8"
          onClick={() => {
            resetBooking();
            nav('/profile');
          }}
        >
          Мои записи
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-12">
      <button
        className="anim flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/80 text-accent-dark shadow-card transition active:scale-90"
        onClick={() => nav(-1)}
        aria-label="Назад"
      >
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <h1 className="anim d1 mt-5 font-display text-[32px] font-semibold leading-tight">
        Выберите время
      </h1>
      <p className="anim d1 mt-1.5 text-sm text-accent-dark/80">
        {service.name} · {master.name}
      </p>

      <div className="card anim d2 mt-6 p-4">
        <div className="flex items-center justify-between">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent-dark transition active:scale-90 active:bg-softer disabled:opacity-30"
            disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Предыдущий месяц"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <p className="font-head text-[15px] font-bold">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-accent-dark transition active:scale-90 active:bg-softer"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Следующий месяц"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const dIso = iso(d);
            const isPast = d < today;
            const isOpen = openDates.has(dIso) && !isPast;
            const isSelected = date === dIso;
            return (
              <button
                key={dIso}
                disabled={!isOpen}
                onClick={() => setDate(dIso)}
                className={`aspect-square rounded-xl text-sm transition ${
                  isSelected
                    ? 'bg-gradient-to-br from-accent to-accent-dark font-bold text-white shadow-btn'
                    : isOpen
                      ? 'bg-softer font-semibold text-accent-deep active:scale-95'
                      : 'text-muted/50'
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {date && (
        <div className="anim mt-5">
          <p className="eyebrow">Свободное время</p>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {slots.map((s) => {
              const disabled = taken.has(s);
              return (
                <button
                  key={s}
                  disabled={disabled}
                  onClick={() => setTime(s)}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                    time === s
                      ? 'bg-gradient-to-br from-accent to-accent-dark text-white shadow-btn'
                      : disabled
                        ? 'bg-soft/30 text-muted line-through'
                        : 'card text-accent-deep active:scale-95'
                  }`}
                >
                  {s}
                </button>
              );
            })}
            {!slots.length && (
              <p className="col-span-4 py-4 text-center text-sm text-muted">
                На этот день свободных окошек нет
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-center text-sm font-medium text-red-500">{error}</p>}

      <button className="btn-primary mt-auto" disabled={!date || !time || busy} onClick={submit}>
        {busy ? 'Записываем…' : 'Подтвердить запись'}
      </button>
    </div>
  );
}
