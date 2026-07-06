/**
 * Выбор мастера для выбранной услуги (мастера студии клиента,
 * умеющие категорию услуги).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../api/http';
import { useApp } from '../store/app';
import type { Master } from '../types';

export default function MasterSelect() {
  const nav = useNavigate();
  const { client, service, setMaster } = useApp();
  const [masters, setMasters] = useState<Master[] | null>(null);

  useEffect(() => {
    if (!service) {
      nav('/services', { replace: true });
      return;
    }
    apiGet<Master[]>(
      `/masters?studio=${client?.studio_id ?? ''}&category=${service.category}`
    ).then((r) => {
      if (r.success && r.data) setMasters(r.data);
      else setMasters([]);
    });
  }, [service, client?.studio_id, nav]);

  if (!service) return null;

  const pick = (m: Master) => {
    setMaster(m);
    nav('/booking/time');
  };

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
        Выберите мастера
      </h1>
      <p className="anim d1 mt-1.5 text-sm text-accent-dark/80">{service.name}</p>

      <div className="mt-6 flex flex-col gap-3">
        {masters === null &&
          [0, 1].map((i) => <div key={i} className="card h-[76px] animate-pulse bg-white/60" />)}
        {masters?.map((m, i) => (
          <button
            key={m.id}
            onClick={() => pick(m)}
            className={`card anim flex items-center gap-4 px-4 py-4 text-left transition active:scale-[0.98] ${
              i === 0 ? 'd2' : i === 1 ? 'd3' : 'd4'
            }`}
          >
            <span className="rounded-full bg-gradient-to-br from-accent to-blush p-[2px]">
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-softer font-display text-lg font-bold text-accent-deep">
                  {m.name.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="flex-1">
              <span className="block font-head text-[15px] font-bold">{m.name}</span>
              {m.specialty && (
                <span className="mt-0.5 block text-xs text-accent-dark/80">{m.specialty}</span>
              )}
            </span>
            <svg className="h-4 w-4 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
        {masters?.length === 0 && (
          <div className="card anim d2 p-6 text-center">
            <p className="text-sm leading-relaxed text-accent-dark">
              В вашей студии пока нет мастера по этой услуге. Попробуйте выбрать
              другую студию или загляните позже.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
