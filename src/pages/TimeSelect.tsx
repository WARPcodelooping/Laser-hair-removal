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
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 pb-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-softer">
          <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-5 text-center font-head text-2xl font-bold">Вы записаны!</h1>
        <p className="mt-2 text-center text-sm text-accent-dark">
          {service.name}
          <br />
          {new Date(done.date_iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, {done.b_time} · {master.name}
        </p>
        <button
          className="btn-primary mt-8"
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
      <button className="flex items-center gap-1 text-sm text-accent-dark" onClick={() => nav(-1)}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Назад
      </button>

      <h1 className="mt-3 font-head text-2xl font-bold">Выберите время</h1>
      <p className="mt-1 text-sm text-accent-dark">
        {service.name} · {master.name}
      </p>

      <div className="card mt-5 p-4">
        <div className="flex items-center justify-between">
          <button
            className="p-1 text-accent-dark disabled:opacity-30"
            disabled={month <= new Date(today.getFullYear(), today.getMonth(), 1)}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Предыдущий месяц"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <p className="font-head font-semibold">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </p>
          <button
            className="p-1 text-accent-dark"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Следующий месяц"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
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
                    ? 'bg-accent font-semibold text-white'
                    : isOpen
                      ? 'bg-softer font-medium text-accent-deep active:scale-95'
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
        <div className="mt-4">
          <p className="text-sm font-semibold">Свободное время</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {slots.map((s) => {
              const disabled = taken.has(s);
              return (
                <button
                  key={s}
                  disabled={disabled}
                  onClick={() => setTime(s)}
                  className={`rounded-xl py-2.5 text-sm font-medium transition ${
                    time === s
                      ? 'bg-accent text-white'
                      : disabled
                        ? 'bg-soft/40 text-muted line-through'
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

      {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

      <button className="btn-primary mt-auto" disabled={!date || !time || busy} onClick={submit}>
        {busy ? 'Записываем…' : 'Подтвердить запись'}
      </button>
    </div>
  );
}
