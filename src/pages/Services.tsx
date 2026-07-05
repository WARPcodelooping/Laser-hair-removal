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
      <h1 className="px-5 font-head text-2xl font-bold">Услуги</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

      <div className="mt-4 flex flex-col gap-4 px-5">
        {groups.map(([group, list]) => (
          <div key={group || 'default'}>
            {group && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-dark">
                {group}
              </p>
            )}
            <div className="flex flex-col gap-2">
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pick(s)}
                  className="card flex items-center justify-between gap-3 px-4 py-3 text-left transition active:scale-[0.98]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    {s.note && <p className="mt-0.5 text-xs text-accent-dark">{s.note}</p>}
                    <p className="mt-0.5 text-xs text-muted">{s.duration} мин</p>
                  </div>
                  <span className="shrink-0 font-head text-sm font-bold text-accent">
                    {fmtPrice(s)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && (
          <p className="py-10 text-center text-sm text-muted">Загрузка услуг…</p>
        )}
      </div>
    </div>
  );
}
