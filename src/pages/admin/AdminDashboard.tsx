/**
 * Админ-панель: записи по дате, мастера (CRUD), услуги (полный CRUD +
 * управление фильтрами-категориями), окошки расписания.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api/http';
import { useApp } from '../../store/app';
import { STUDIOS } from '../../../shared/domain.js';
import type { Booking, Category, Master, Service, Studio } from '../../types';

type Tab = 'bookings' | 'masters' | 'services' | 'schedule';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>('bookings');

  // Категории (все, включая скрытые) — общие для вкладок
  const [cats, setCats] = useState<Category[]>([]);
  const { setCategories } = useApp();

  const loadCats = () =>
    apiGet<Category[]>('/admin/categories').then((r) => {
      if (r.success && r.data) {
        setCats(r.data);
        // обновляем и клиентский справочник (активные, по порядку)
        setCategories(r.data.filter((c) => c.active !== false));
      }
    });

  useEffect(() => {
    loadCats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-12">
      <div className="flex items-center justify-between px-5">
        <h1 className="font-display text-[30px] font-semibold">Админка</h1>
        <button
          className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-sm font-semibold text-accent shadow-card transition active:scale-95"
          onClick={() => nav('/')}
        >
          Выйти
        </button>
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {(
          [
            ['bookings', 'Записи'],
            ['masters', 'Мастера'],
            ['services', 'Услуги'],
            ['schedule', 'Окошки'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`pill shrink-0 ${tab === id ? 'pill-active' : 'pill-idle'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 px-5 pb-8 pt-4">
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'masters' && <MastersTab cats={cats.filter((c) => c.active !== false)} />}
        {tab === 'services' && <ServicesTab cats={cats} onCatsChanged={loadCats} />}
        {tab === 'schedule' && <ScheduleTab />}
      </div>
    </div>
  );
}

// ── Записи ────────────────────────────────────────────────────
function BookingsTab() {
  const [date, setDate] = useState(todayIso());
  const [list, setList] = useState<Booking[]>([]);

  const load = () =>
    apiGet<Booking[]>(`/admin/bookings?date=${date}`).then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const setStatus = async (id: string, status: string) => {
    await apiPost(`/admin/bookings/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      <div className="mt-3 flex flex-col gap-2">
        {list.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-head text-[15px] font-bold">{b.b_time}</p>
              <span
                className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${
                  b.status === 'booked'
                    ? 'bg-softer text-accent-deep'
                    : b.status === 'done'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                }`}
              >
                {b.status === 'booked' ? 'Активна' : b.status === 'done' ? 'Завершена' : 'Отменена'}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium">{b.service_name}</p>
            <p className="mt-0.5 text-xs text-accent-dark">
              Мастер: {b.master_name} · {b.price.toLocaleString('ru-RU')} ₽
            </p>
            <p className="text-xs text-accent-dark">
              {b.client_name} {b.client_username ? `@${b.client_username}` : ''} {b.client_phone}
            </p>
            {b.status === 'booked' && (
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-xl bg-softer py-2 text-xs font-semibold text-accent-deep transition active:scale-95" onClick={() => setStatus(b.id, 'done')}>
                  Завершить
                </button>
                <button className="flex-1 rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-500 transition active:scale-95" onClick={() => setStatus(b.id, 'cancelled')}>
                  Отменить
                </button>
              </div>
            )}
          </div>
        ))}
        {!list.length && <p className="py-8 text-center text-sm text-muted">Записей на эту дату нет</p>}
      </div>
    </div>
  );
}

// ── Мастера ───────────────────────────────────────────────────
function MastersTab({ cats }: { cats: Category[] }) {
  const [list, setList] = useState<Master[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [studioId, setStudioId] = useState((STUDIOS as Studio[])[0].id);
  const [mCats, setMCats] = useState<string[]>([]);

  const load = () =>
    apiGet<Master[]>('/admin/masters').then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
  }, []);

  const toggleCat = (id: string) =>
    setMCats((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const add = async () => {
    if (!name.trim()) return;
    await apiPost('/admin/masters', { name: name.trim(), specialty, studio_id: studioId, categories: mCats });
    setName('');
    setSpecialty('');
    setMCats([]);
    setAdding(false);
    load();
  };

  const toggleActive = async (m: Master) => {
    await apiPost(`/admin/masters/${m.id}`, { active: !m.active });
    load();
  };

  return (
    <div className="flex flex-col gap-2">
      {list.map((m) => {
        const studio = (STUDIOS as Studio[]).find((s) => s.id === m.studio_id);
        return (
          <div key={m.id} className={`card p-4 ${m.active ? '' : 'opacity-50'}`}>
            <div className="flex items-center justify-between">
              <p className="font-head text-[15px] font-bold">{m.name}</p>
              <button className="text-xs font-semibold text-accent" onClick={() => toggleActive(m)}>
                {m.active ? 'Скрыть' : 'Вернуть'}
              </button>
            </div>
            {m.specialty && <p className="text-xs text-accent-dark">{m.specialty}</p>}
            <p className="mt-0.5 text-xs text-muted">
              {studio ? `${studio.city}, ${studio.address}` : m.studio_id} ·{' '}
              {m.categories.map((c) => cats.find((x) => x.id === c)?.name || c).join(', ')}
            </p>
          </div>
        );
      })}

      {adding ? (
        <div className="card p-4">
          <input className="input" placeholder="Имя мастера" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="input mt-2"
            placeholder="Специализация (например, «Лазерная эпиляция»)"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <select className="input mt-2" value={studioId} onChange={(e) => setStudioId(e.target.value)}>
            {(STUDIOS as Studio[]).map((s) => (
              <option key={s.id} value={s.id}>
                {s.city}, {s.address}
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs font-semibold text-accent-dark">Категории услуг:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <button key={c.id} onClick={() => toggleCat(c.id)} className={`pill text-xs ${mCats.includes(c.id) ? 'pill-active' : 'pill-idle'}`}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary flex-1 py-2.5" onClick={add}>
              Добавить
            </button>
            <button className="btn-outline flex-1 py-2.5" onClick={() => setAdding(false)}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-outline" onClick={() => setAdding(true)}>
          + Новый мастер
        </button>
      )}
    </div>
  );
}

// ── Услуги: редактор одной услуги ─────────────────────────────
interface SvcForm {
  name: string;
  note: string;
  grp: string;
  price: string;
  price_max: string;
  duration: string;
  category: string;
}

const emptyForm = (category: string): SvcForm => ({
  name: '',
  note: '',
  grp: '',
  price: '',
  price_max: '',
  duration: '30',
  category,
});

const formFromService = (s: Service): SvcForm => ({
  name: s.name,
  note: s.note || '',
  grp: s.grp || '',
  price: String(s.price),
  price_max: s.price_max ? String(s.price_max) : '',
  duration: String(s.duration),
  category: s.category,
});

function ServiceEditor({
  title,
  form,
  setForm,
  cats,
  groups,
  onSave,
  onCancel,
  saving,
}: {
  title: string;
  form: SvcForm;
  setForm: (f: SvcForm) => void;
  cats: Category[];
  groups: string[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const priceOk = Number(form.price) > 0;
  const canSave = form.name.trim().length > 0 && priceOk && !saving;

  return (
    <div className="card animate-rise border-2 border-accent/30 p-4">
      <p className="font-head text-[15px] font-bold">{title}</p>

      <label className="mt-3 block text-xs font-semibold text-accent-dark">Название</label>
      <input
        className="input mt-1"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Например, «Голени»"
      />

      <label className="mt-3 block text-xs font-semibold text-accent-dark">
        Группа в списке <span className="font-normal text-muted">(необязательно)</span>
      </label>
      <input
        className="input mt-1"
        value={form.grp}
        onChange={(e) => setForm({ ...form, grp: e.target.value })}
        placeholder="Например, «Ноги»"
        list="admin-svc-groups"
      />
      <datalist id="admin-svc-groups">
        {groups.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      <label className="mt-3 block text-xs font-semibold text-accent-dark">
        Описание <span className="font-normal text-muted">(необязательно)</span>
      </label>
      <input
        className="input mt-1"
        value={form.note}
        onChange={(e) => setForm({ ...form, note: e.target.value })}
        placeholder="Короткое пояснение под названием"
      />

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-accent-dark">Цена, ₽</label>
          <input
            className="input mt-1"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
            inputMode="numeric"
            placeholder="1500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-accent-dark">
            Цена до <span className="font-normal text-muted">(опц.)</span>
          </label>
          <input
            className="input mt-1"
            value={form.price_max}
            onChange={(e) => setForm({ ...form, price_max: e.target.value.replace(/\D/g, '') })}
            inputMode="numeric"
            placeholder="—"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-semibold text-accent-dark">Мин.</label>
          <input
            className="input mt-1"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value.replace(/\D/g, '') })}
            inputMode="numeric"
            placeholder="30"
          />
        </div>
      </div>

      <label className="mt-3 block text-xs font-semibold text-accent-dark">Фильтр (категория)</label>
      <select
        className="input mt-1"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        {cats.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.active === false ? ' (скрыт)' : ''}
          </option>
        ))}
      </select>

      <div className="mt-4 flex gap-2">
        <button className="btn-primary flex-1 py-2.5" disabled={!canSave} onClick={onSave}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button className="btn-outline flex-1 py-2.5" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}

// ── Услуги + фильтры ──────────────────────────────────────────
function ServicesTab({ cats, onCatsChanged }: { cats: Category[]; onCatsChanged: () => void }) {
  const [list, setList] = useState<Service[]>([]);
  const [cat, setCat] = useState('');
  const [manageCats, setManageCats] = useState(false);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<SvcForm>(emptyForm(''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    apiGet<Service[]>('/admin/services').then((r) => {
      if (r.success && r.data) setList(r.data);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (cats.length && !cats.some((c) => c.id === cat)) setCat(cats[0].id);
  }, [cats, cat]);

  const inCat = useMemo(() => list.filter((s) => s.category === cat), [list, cat]);
  const groups = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of inCat) {
      const g = s.grp || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return [...map.entries()];
  }, [inCat]);
  const allGroups = useMemo(
    () => [...new Set(list.map((s) => s.grp).filter(Boolean))] as string[],
    [list]
  );

  const startNew = () => {
    setForm(emptyForm(cat));
    setEditing('new');
    setError('');
  };

  const startEdit = (s: Service) => {
    setForm(formFromService(s));
    setEditing(s.id);
    setError('');
  };

  const saveForm = async () => {
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      note: form.note.trim() || null,
      grp: form.grp.trim() || null,
      price: Number(form.price),
      price_max: Number(form.price_max) > 0 ? Number(form.price_max) : null,
      duration: Number(form.duration) > 0 ? Number(form.duration) : 30,
      category: form.category,
    };
    const r =
      editing === 'new'
        ? await apiPost('/admin/services', payload)
        : await apiPost(`/admin/services/${editing}`, payload);
    setSaving(false);
    if (!r.success) {
      setError(r.error?.message || 'Не получилось сохранить');
      return;
    }
    setEditing(null);
    load();
  };

  const toggle = async (s: Service) => {
    await apiPost(`/admin/services/${s.id}`, { active: !s.active });
    load();
  };

  const fmtPrice = (s: Service) =>
    s.price_max
      ? `${s.price.toLocaleString('ru-RU')}–${s.price_max.toLocaleString('ru-RU')} ₽`
      : `${s.price.toLocaleString('ru-RU')} ₽`;

  return (
    <div>
      {/* Фильтры-категории: все видны сразу, с переносом строк */}
      <div className="flex flex-wrap items-center gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`pill text-xs ${cat === c.id ? 'pill-active' : 'pill-idle'} ${
              c.active === false ? 'opacity-50' : ''
            }`}
          >
            {c.name}
          </button>
        ))}
        <button
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-pill border px-3.5 text-xs font-semibold shadow-card transition active:scale-95 ${
            manageCats ? 'border-accent bg-accent text-white' : 'border-white/70 bg-white/80 text-accent-dark'
          }`}
          onClick={() => setManageCats(!manageCats)}
          aria-label="Настроить фильтры"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Настроить
        </button>
      </div>

      {manageCats && <CategoryManager cats={cats} services={list} onChanged={onCatsChanged} />}

      {/* Список услуг выбранной категории */}
      <div className="mt-3 flex flex-col gap-4">
        {groups.map(([group, svcs]) => (
          <div key={group || 'default'}>
            {group && <p className="eyebrow mb-2">{group}</p>}
            <div className="flex flex-col gap-1.5">
              {svcs.map((s) =>
                editing === s.id ? (
                  <ServiceEditor
                    key={s.id}
                    title="Редактирование услуги"
                    form={form}
                    setForm={setForm}
                    cats={cats}
                    groups={allGroups}
                    onSave={saveForm}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                  />
                ) : (
                  <div key={s.id} className={`card flex items-center gap-2 px-3.5 py-3 ${s.active ? '' : 'opacity-50'}`}>
                    <button className="min-w-0 flex-1 text-left" onClick={() => startEdit(s)}>
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      {s.note && <p className="mt-0.5 truncate text-xs text-accent-dark/80">{s.note}</p>}
                      <p className="mt-0.5 text-xs text-muted">{s.duration} мин</p>
                    </button>
                    <button className="shrink-0 font-display text-base font-bold text-accent" onClick={() => startEdit(s)}>
                      {fmtPrice(s)}
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <button
                        className="rounded-full bg-softer px-2.5 py-1 text-[11px] font-semibold text-accent-deep transition active:scale-95"
                        onClick={() => startEdit(s)}
                      >
                        Изменить
                      </button>
                      <button className="px-2.5 text-[11px] font-medium text-muted" onClick={() => toggle(s)}>
                        {s.active ? 'Скрыть' : 'Вернуть'}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
        {!inCat.length && editing !== 'new' && (
          <p className="py-6 text-center text-sm text-muted">В этом фильтре пока нет услуг</p>
        )}

        {editing === 'new' ? (
          <ServiceEditor
            title="Новая услуга"
            form={form}
            setForm={setForm}
            cats={cats}
            groups={allGroups}
            onSave={saveForm}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        ) : (
          <button className="btn-outline" onClick={startNew}>
            + Новая услуга
          </button>
        )}
        {error && <p className="text-center text-sm font-medium text-red-500">{error}</p>}
      </div>
    </div>
  );
}

// ── Управление фильтрами-категориями ──────────────────────────
function CategoryManager({
  cats,
  services,
  onChanged,
}: {
  cats: Category[];
  services: Service[];
  onChanged: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [error, setError] = useState('');

  const countIn = (id: string) => services.filter((s) => s.category === id).length;

  const run = async (p: Promise<{ success: boolean; error?: { message: string } }>) => {
    setError('');
    const r = await p;
    if (!r.success) setError(r.error?.message || 'Ошибка');
    onChanged();
  };

  const add = async () => {
    if (!newName.trim()) return;
    await run(apiPost('/admin/categories', { name: newName.trim() }));
    setNewName('');
  };

  const rename = async (id: string) => {
    if (!renameVal.trim()) return;
    await run(apiPost(`/admin/categories/${id}`, { name: renameVal.trim() }));
    setRenamingId(null);
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await run(apiPost('/admin/categories/reorder', { ids }));
  };

  return (
    <div className="card animate-rise mt-3 p-4">
      <p className="font-head text-[15px] font-bold">Фильтры услуг</p>
      <p className="mt-0.5 text-xs text-accent-dark/80">
        Порядок, названия и видимость фильтров в каталоге
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {cats.map((c, i) => (
          <div key={c.id} className={`flex items-center gap-1.5 rounded-xl bg-softer/50 px-2.5 py-2 ${c.active === false ? 'opacity-60' : ''}`}>
            {renamingId === c.id ? (
              <>
                <input
                  className="input min-w-0 flex-1 px-2.5 py-1.5 text-sm"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  autoFocus
                />
                <button className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-white" onClick={() => rename(c.id)}>
                  ОК
                </button>
                <button className="px-1.5 text-[11px] text-muted" onClick={() => setRenamingId(null)}>
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                  onClick={() => {
                    setRenamingId(c.id);
                    setRenameVal(c.name);
                  }}
                  title="Нажмите, чтобы переименовать"
                >
                  {c.name}
                  <span className="ml-1.5 text-xs font-normal text-muted">{countIn(c.id)}</span>
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full text-accent-dark transition active:scale-90 disabled:opacity-25"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Выше"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full text-accent-dark transition active:scale-90 disabled:opacity-25"
                  disabled={i === cats.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Ниже"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full text-accent-dark transition active:scale-90"
                  onClick={() => run(apiPost(`/admin/categories/${c.id}`, { active: c.active === false }))}
                  aria-label={c.active === false ? 'Показать' : 'Скрыть'}
                  title={c.active === false ? 'Показать в каталоге' : 'Скрыть из каталога'}
                >
                  {c.active === false ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full text-red-400 transition active:scale-90 disabled:opacity-25"
                  disabled={countIn(c.id) > 0}
                  onClick={() => {
                    if (confirm(`Удалить фильтр «${c.name}»?`)) {
                      run(apiPost(`/admin/categories/${c.id}/delete`));
                    }
                  }}
                  aria-label="Удалить"
                  title={countIn(c.id) > 0 ? 'Сначала перенесите услуги в другой фильтр' : 'Удалить'}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="input flex-1 py-2.5"
          placeholder="Новый фильтр, например «Шугаринг»"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          className="rounded-xl bg-gradient-to-br from-accent to-accent-dark px-4 text-sm font-bold text-white shadow-btn transition active:scale-95 disabled:opacity-50"
          disabled={!newName.trim()}
          onClick={add}
        >
          Добавить
        </button>
      </div>
      {error && <p className="mt-2 text-center text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

// ── Окошки ────────────────────────────────────────────────────
function ScheduleTab() {
  const [masters, setMasters] = useState<Master[]>([]);
  const [masterId, setMasterId] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState('10:00');

  useEffect(() => {
    apiGet<Master[]>('/admin/masters').then((r) => {
      if (r.success && r.data) {
        setMasters(r.data);
        if (r.data.length && masterId === null) setMasterId(r.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    if (masterId === null) return;
    apiGet<{ weekly: unknown; dates: { d: string; slots: string[] }[] }>(
      `/admin/schedule?master=${masterId}&from=${date}&to=${date}`
    ).then((r) => {
      if (r.success && r.data) setSlots(r.data.dates[0]?.slots || []);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterId, date]);

  const save = async (next: string[]) => {
    if (masterId === null) return;
    const sorted = [...new Set(next)].sort();
    await apiPost('/admin/schedule/date', { master_id: masterId, date, slots: sorted });
    setSlots(sorted);
  };

  return (
    <div>
      <select className="input" value={masterId ?? ''} onChange={(e) => setMasterId(Number(e.target.value))}>
        {masters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <input type="date" className="input mt-2" value={date} onChange={(e) => setDate(e.target.value)} />

      <p className="mt-4 text-xs font-semibold text-accent-dark">Окошки на день:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((s) => (
          <button key={s} className="pill pill-idle text-sm" onClick={() => save(slots.filter((x) => x !== s))} title="Нажмите, чтобы удалить">
            {s} ✕
          </button>
        ))}
        {!slots.length && <p className="text-sm text-muted">Выходной (окошек нет)</p>}
      </div>

      <div className="mt-4 flex gap-2">
        <input type="time" className="input flex-1" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
        <button
          className="rounded-xl bg-gradient-to-br from-accent to-accent-dark px-5 text-sm font-bold text-white shadow-btn transition active:scale-95"
          onClick={() => newSlot && save([...slots, newSlot])}
        >
          Добавить
        </button>
      </div>
      {!masters.length && (
        <p className="mt-6 text-center text-sm text-muted">Сначала добавьте мастера во вкладке «Мастера»</p>
      )}
    </div>
  );
}
