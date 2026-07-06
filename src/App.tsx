/**
 * App.tsx
 * Гейты онбординга: согласие → город → студия → приложение.
 */
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { apiGet } from './api/http';
import { useApp } from './store/app';
import type { Client, Loyalty } from './types';
import Consent from './pages/Consent';
import CitySelect from './pages/CitySelect';
import StudioSelect from './pages/StudioSelect';
import ClientLayout from './layouts/ClientLayout';
import Home from './pages/Home';
import Services from './pages/Services';
import MasterSelect from './pages/MasterSelect';
import TimeSelect from './pages/TimeSelect';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';

type Gate = 'loading' | 'consent' | 'city' | 'studio' | 'app';

export default function App() {
  const { client, setMe, isAdmin } = useApp();
  const [gate, setGate] = useState<Gate>('loading');

  const refresh = async () => {
    const res = await apiGet<{ client: Client; loyalty: Loyalty; isAdmin: boolean }>('/me');
    if (!res.success || !res.data) {
      setGate('consent'); // без ответа сервера показываем согласие (dev)
      return;
    }
    const { client: c, loyalty, isAdmin: admin } = res.data;
    setMe(c, loyalty, admin);
    if (!c.consent_at) setGate('consent');
    else if (!c.city) setGate('city');
    else if (!c.studio_id) setGate('studio');
    else setGate('app');
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gate === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-soft border-t-accent" />
          <span className="font-display text-xl font-bold italic text-accent">L</span>
        </div>
        <p className="text-xs font-medium tracking-wide text-muted">Загружаем…</p>
      </div>
    );
  }

  if (gate === 'consent') return <Consent onDone={refresh} />;
  if (gate === 'city') return <CitySelect onDone={refresh} />;
  if (gate === 'studio') return <StudioSelect city={client?.city ?? ''} onDone={refresh} />;

  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/booking/master" element={<MasterSelect />} />
      <Route path="/booking/time" element={<TimeSelect />} />
      {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
