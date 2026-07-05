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
      <button className="flex items-center gap-1 text-sm text-accent-dark" onClick={() => nav(-1)}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Назад
      </button>

      <h1 className="mt-3 font-head text-2xl font-bold">Выберите мастера</h1>
      <p className="mt-1 text-sm text-accent-dark">{service.name}</p>

      <div className="mt-5 flex flex-col gap-3">
        {masters === null && (
          <p className="py-10 text-center text-sm text-muted">Загрузка…</p>
        )}
        {masters?.map((m) => (
          <button
            key={m.id}
            onClick={() => pick(m)}
            className="card flex items-center gap-3 px-4 py-3.5 text-left transition active:scale-[0.98]"
          >
            {m.photo_url ? (
              <img src={m.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-soft font-head font-bold text-accent-deep">
                {m.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="font-head font-semibold">{m.name}</p>
              {m.specialty && <p className="text-xs text-accent-dark">{m.specialty}</p>}
            </div>
          </button>
        ))}
        {masters?.length === 0 && (
          <div className="card p-5 text-center">
            <p className="text-sm text-accent-dark">
              В вашей студии пока нет мастера по этой услуге. Попробуйте выбрать
              другую студию или загляните позже.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
