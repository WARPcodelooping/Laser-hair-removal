/**
 * Каталог услуг: категории-таблетки, группировка по зонам, выбор услуги.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../api/http';
import { useApp } from '../store/app';
import { CATEGORIES } from '../../shared/domain.js';
import type { Service, Category } from '../types';

const fmtPrice = (s: Service) => {
  const base = s.price.toLocaleString('ru-RU');
  if (s.price_max) return `${base}–${s.price_max.toLocaleString('ru-RU')} ₽`;
  if (s.price_from) return `от ${base} ₽`;
  return `${base} ₽`;
};

export default function Services() {
  const nav = useNavigate();
  const { setService } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [cat, setCat] = useState<string>((CATEGORIES as Category[])[0].id);

  useEffect(() => {
    apiGet<Service[]>('/services').then((r) => {
      if (r.success && r.data) setServices(r.data);
    });
  }, []);

  const inCat = useMemo(() => services.filter((s) => s.category === cat), [services, cat]);

  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of inCat) {
      const g = s.grp || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return [...map.entries()];
  }, [inCat]);

  const pick = (s: Service) => {
    setService(s);
    nav('/booking/master');
  };

  return (
    <div className="pt-12">
      <header className="anim px-5">
        <p className="eyebrow">Каталог</p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight">Услуги</h1>
      </header>

      <div className="anim d1 no-scrollbar mt-5 flex gap-2 overflow-x-auto px-5 pb-2">
        {(CATEGORIES as Category[]).map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`pill ${cat === c.id ? 'pill-active' : 'pill-idle'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-5 px-5">
        {groups.map(([group, list]) => (
          <div key={group || 'default'} className="anim d2">
            {group && <p className="eyebrow mb-2.5">{group}</p>}
            <div className="flex flex-col gap-2.5">
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s)}
                  className="card flex items-center justify-between gap-3 px-4 py-3.5 text-left transition active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium">{s.name}</p>
                    {s.note && <p className="mt-0.5 text-xs text-accent-dark/80">{s.note}</p>}
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {s.duration} мин
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-lg font-bold text-accent">
                    {fmtPrice(s)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-[72px] animate-pulse bg-white/60" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
