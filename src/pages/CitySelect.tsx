/**
 * Выбор города.
 */
import { useState } from 'react';
import { apiPost } from '../api/http';
import { CITIES } from '../../shared/domain.js';

export default function CitySelect({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    await apiPost('/me', { city: selected, studio_id: null });
    onDone();
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-16">
      <p className="eyebrow anim">Шаг 1 из 2</p>
      <h1 className="anim mt-2 font-display text-[32px] font-semibold leading-tight">
        Выберите город
      </h1>
      <p className="anim d1 mt-1.5 text-sm text-accent-dark/80">
        Где вам удобно посещать студию?
      </p>

      <div className="mt-7 flex flex-col gap-3">
        {(CITIES as string[]).map((city, i) => {
          const active = selected === city;
          return (
            <button
              key={city}
              onClick={() => setSelected(city)}
              className={`card anim flex items-center justify-between px-5 py-4 text-left font-head text-[15px] font-bold transition active:scale-[0.98] ${
                i === 0 ? 'd1' : i === 1 ? 'd2' : 'd3'
              } ${active ? 'shadow-card-lift ring-2 ring-accent' : ''}`}
            >
              {city}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full transition ${
                  active ? 'bg-gradient-to-br from-accent to-accent-dark' : 'border border-soft'
                }`}
              >
                {active && (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </span>
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
