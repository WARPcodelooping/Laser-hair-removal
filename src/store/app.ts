/**
 * store/app.ts
 * Глобальное состояние: профиль, город/студия, флоу записи.
 */
import { create } from 'zustand';
import type { Client, Loyalty, Service, Master } from '../types';

interface AppState {
  // Профиль
  client: Client | null;
  loyalty: Loyalty | null;
  isAdmin: boolean;
  loaded: boolean;
  setMe: (c: Client, l: Loyalty, admin: boolean) => void;

  // Флоу записи
  service: Service | null;
  master: Master | null;
  setService: (s: Service | null) => void;
  setMaster: (m: Master | null) => void;
  resetBooking: () => void;
}

export const useApp = create<AppState>((set) => ({
  client: null,
  loyalty: null,
  isAdmin: false,
  loaded: false,
  setMe: (client, loyalty, isAdmin) => set({ client, loyalty, isAdmin, loaded: true }),

  service: null,
  master: null,
  setService: (service) => set({ service, master: null }),
  setMaster: (master) => set({ master }),
  resetBooking: () => set({ service: null, master: null }),
}));
