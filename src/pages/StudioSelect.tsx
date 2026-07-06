/**
 * Выбор студии в городе.
 */
import { useState } from 'react';
import { apiPost } from '../api/http';
import { STUDIOS } from '../../shared/domain.js';
import type { Studio } from '../types';

export default function StudioSelect({ city, onDone }: { city: string; onDone: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const studios = (STUDIOS as Studio[]).filter((s) => s.city === city);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    await apiPost('/me', { studio_id: selected });
    onDone();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16">
      <p className="eyebrow anim">Шаг 2 из 2 · {city}</p>
      <h1 className="anim mt-2 font-display text-[32px] font-semibold leading-tight">
        Выберите студию
      </h1>
      <p className="anim d1 mt-1.5 text-sm text-accent-dark/80">
        Её всегда можно поменять в профиле
      </p>

      <div className="mt-7 flex flex-col gap-3">
        {studios.map((s, i) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`card anim flex items-center gap-4 px-4 py-4 text-left transition active:scale-[0.98] ${
                i === 0 ? 'd1' : i === 1 ? 'd2' : 'd3'
              } ${active ? 'shadow-card-lift ring-2 ring-accent' : ''}`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
                  active
                    ? 'bg-gradient-to-br from-accent to-accent-dark text-white'
                    : 'bg-gradient-to-br from-softer to-soft/60 text-accent'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </span>
              <span className="flex-1 font-head text-[15px] font-bold leading-snug">{s.address}</span>
              {active && (
                <svg className="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <button className="btn-primary anim d4 mt-auto" disabled={!selected || busy} onClick={submit}>
        Продолжить
      </button>
    </div>
  );
}
