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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-14">
      <h1 className="font-head text-2xl font-bold">Выберите студию</h1>
      <p className="mt-1 text-sm text-accent-dark">{city}</p>

      <div className="mt-6 flex flex-col gap-3">
        {studios.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`card flex items-center gap-3 px-4 py-4 text-left transition active:scale-[0.98] ${
              selected === s.id ? 'border-2 border-accent' : ''
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-softer">
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </span>
            <span className="font-head font-semibold">{s.address}</span>
          </button>
        ))}
      </div>

      <button className="btn-primary mt-auto" disabled={!selected || busy} onClick={submit}>
        Продолжить
      </button>
    </div>
  );
}
