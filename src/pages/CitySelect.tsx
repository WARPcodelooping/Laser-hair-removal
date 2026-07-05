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
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-8 pt-14">
      <h1 className="font-head text-2xl font-bold">Выберите город</h1>
      <p className="mt-1 text-sm text-accent-dark">Где вам удобно посещать студию?</p>

      <div className="mt-6 flex flex-col gap-3">
        {(CITIES as string[]).map((city) => (
          <button
            key={city}
            onClick={() => setSelected(city)}
            className={`card flex items-center justify-between px-4 py-4 text-left font-head font-semibold transition active:scale-[0.98] ${
              selected === city ? 'border-2 border-accent' : ''
            }`}
          >
            {city}
            {selected === city && (
              <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <button className="btn-primary mt-auto" disabled={!selected || busy} onClick={submit}>
        Продолжить
      </button>
    </div>
  );
}
