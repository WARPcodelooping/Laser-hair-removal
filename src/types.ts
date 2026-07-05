export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface Studio {
  id: string;
  city: string;
  address: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Service {
  id: string;
  category: string;
  grp: string | null;
  name: string;
  note: string | null;
  price: number;
  price_max: number | null;
  price_from: boolean;
  duration: number;
  active: boolean;
}

export interface Master {
  id: number;
  name: string;
  specialty: string | null;
  studio_id: string;
  photo_url: string | null;
  categories: string[];
  active: boolean;
}

export interface Client {
  id: number;
  name: string | null;
  username: string | null;
  phone: string | null;
  photo_url: string | null;
  city: string | null;
  studio_id: string | null;
  consent_at: string | null;
}

export interface Loyalty {
  minVisits: number;
  discount: number;
  title: string;
  visits: number;
  next: { minVisits: number; discount: number; title: string } | null;
  toNext: number;
}

export interface Booking {
  id: string;
  client_id: number;
  master_id: number;
  service_id: string;
  studio_id: string;
  date_iso: string;
  b_time: string;
  price: number;
  discount: number;
  status: 'booked' | 'done' | 'cancelled';
  master_name?: string;
  service_name?: string;
  client_name?: string;
  client_phone?: string;
  client_username?: string;
}
