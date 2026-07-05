/**
 * shared/domain.js
 * Единый источник правды для фронтенда и бэкенда:
 * города, студии, категории, услуги, лояльность, статусы записей.
 * Файл без сборки импортируется и Vite (src), и Node (server).
 */

// ── Города и студии ───────────────────────────────────────────
export const CITIES = ['Ставрополь', 'Будённовск', 'Пятигорск', 'Михайловск'];

export const STUDIOS = [
  { id: 'stv-mira', city: 'Ставрополь', address: 'ул. Мира, 45' },
  { id: 'stv-kulakova', city: 'Ставрополь', address: 'пр-т Кулакова, 12' },
  { id: 'bud-oktyabrskaya', city: 'Будённовск', address: 'ул. Октябрьская, 78' },
  { id: 'bud-mkr8', city: 'Будённовск', address: '8-й микрорайон, 21' },
  { id: 'pyat-kirova', city: 'Пятигорск', address: 'пр-т Кирова, 63' },
  { id: 'pyat-pana', city: 'Пятигорск', address: 'ул. Панагюриште, 16' },
  { id: 'mih-lenina', city: 'Михайловск', address: 'ул. Ленина, 154' },
  { id: 'mih-gagarina', city: 'Михайловск', address: 'ул. Гагарина, 3' },
];

// ── Категории услуг ───────────────────────────────────────────
export const CATEGORIES = [
  { id: 'alex', name: 'Александритовый лазер', icon: 'bolt' },
  { id: 'diode', name: 'Диодный лазер', icon: 'flare' },
  { id: 'cosmetology', name: 'Косметология', icon: 'droplet' },
  { id: 'intimate', name: 'Интимная косметология', icon: 'lock' },
  { id: 'massage', name: 'Массаж', icon: 'hand-stop' },
  { id: 'botox', name: 'Ботулинотерапия', icon: 'vaccine' },
];

// ── Услуги ────────────────────────────────────────────────────
// price — в рублях; priceMax — верхняя граница «от … до …» (null, если цена фиксированная);
// priceFrom — true, если цена «от»; duration — минуты.
export const SERVICES = [
  // ── Александритовый лазер: зона рук
  { id: 'alex-armpits', category: 'alex', group: 'Зона рук', name: 'Подмышки', price: 1500, duration: 15 },
  { id: 'alex-shoulders', category: 'alex', group: 'Зона рук', name: 'Плечи', price: 2500, duration: 20 },
  { id: 'alex-arms-full', category: 'alex', group: 'Зона рук', name: 'Руки полностью', price: 4500, duration: 35 },
  { id: 'alex-forearms', category: 'alex', group: 'Зона рук', name: 'Руки до локтя', price: 2800, duration: 25 },
  // ── Александритовый лазер: бикини
  { id: 'alex-bikini-line', category: 'alex', group: 'Бикини', name: 'Линия бикини', price: 1000, duration: 15 },
  { id: 'alex-bikini-classic', category: 'alex', group: 'Бикини', name: 'Классическое бикини', price: 1500, duration: 20 },
  { id: 'alex-bikini-total', category: 'alex', group: 'Бикини', name: 'Тотальное бикини', price: 3700, duration: 30 },
  // ── Александритовый лазер: ноги
  { id: 'alex-shins', category: 'alex', group: 'Ноги', name: 'Голени (вкл. колени)', price: 4000, duration: 30 },
  { id: 'alex-thighs', category: 'alex', group: 'Ноги', name: 'Бёдра', price: 4500, duration: 30 },
  { id: 'alex-buttocks', category: 'alex', group: 'Ноги', name: 'Ягодицы', price: 3000, duration: 20 },
  { id: 'alex-legs-full', category: 'alex', group: 'Ноги', name: 'Ноги полностью (вкл. пальцы ног)', price: 7500, duration: 60 },
  // ── Александритовый лазер: тело
  { id: 'alex-areolas', category: 'alex', group: 'Тело', name: 'Ареолы сосков', price: 800, duration: 10 },
  { id: 'alex-belly-line', category: 'alex', group: 'Тело', name: 'Линия живота', price: 800, duration: 10 },
  { id: 'alex-loins', category: 'alex', group: 'Тело', name: 'Поясница', price: 3000, duration: 20 },
  { id: 'alex-belly-full', category: 'alex', group: 'Тело', name: 'Живот полностью', price: 2500, duration: 20 },
  { id: 'alex-back-full', category: 'alex', group: 'Тело', name: 'Спина полностью', price: 5500, duration: 40 },
  // ── Александритовый лазер: лицо
  { id: 'alex-brows', category: 'alex', group: 'Лицо', name: 'Межбровная область', price: 500, duration: 10 },
  { id: 'alex-lip', category: 'alex', group: 'Лицо', name: 'Верхняя губа', price: 1000, duration: 10 },
  { id: 'alex-cheekbones', category: 'alex', group: 'Лицо', name: 'Скулы', price: 800, duration: 10 },
  { id: 'alex-forehead', category: 'alex', group: 'Лицо', name: 'Область лба', price: 700, duration: 10 },
  { id: 'alex-temples', category: 'alex', group: 'Лицо', name: 'Височная область', price: 500, duration: 10 },
  { id: 'alex-chin', category: 'alex', group: 'Лицо', name: 'Подбородок', price: 700, duration: 10 },
  { id: 'alex-face-full', category: 'alex', group: 'Лицо', name: 'Лицо полностью', price: 2900, duration: 25 },
  // ── Александритовый лазер: комплексы
  { id: 'alex-combo-m', category: 'alex', group: 'Комплексы', name: 'Комплекс M', note: 'Голени (вкл. колени и пальцы) + тотальное бикини + подмышки в подарок', price: 7700, duration: 60 },
  { id: 'alex-combo-l', category: 'alex', group: 'Комплексы', name: 'Комплекс L', note: 'Ноги полностью + тотальное бикини + подмышки в подарок', price: 11200, duration: 90 },
  { id: 'alex-combo-xl', category: 'alex', group: 'Комплексы', name: 'Комплекс XL', note: 'Всё тело + лицо полностью, либо любые зоны на лице', price: 15700, duration: 120 },

  // ── Диодный лазер: лицо и шея
  { id: 'diode-brows', category: 'diode', group: 'Лицо и шея', name: 'Межбровная область', price: 500, duration: 10 },
  { id: 'diode-lip', category: 'diode', group: 'Лицо и шея', name: 'Верхняя губа', price: 500, duration: 10 },
  { id: 'diode-cheeks', category: 'diode', group: 'Лицо и шея', name: 'Область щёк', price: 500, duration: 10 },
  { id: 'diode-forehead', category: 'diode', group: 'Лицо и шея', name: 'Область лба', price: 500, duration: 10 },
  { id: 'diode-temples', category: 'diode', group: 'Лицо и шея', name: 'Височная область', price: 500, duration: 10 },
  { id: 'diode-chin', category: 'diode', group: 'Лицо и шея', name: 'Подбородок', price: 700, duration: 10 },
  { id: 'diode-face-full', category: 'diode', group: 'Лицо и шея', name: 'Лицо полностью', price: 1990, duration: 25 },
  // ── Диодный лазер: тело
  { id: 'diode-areolas', category: 'diode', group: 'Тело', name: 'Ареолы сосков', price: 500, duration: 10 },
  { id: 'diode-belly-line', category: 'diode', group: 'Тело', name: 'Линия живота', price: 800, duration: 10 },
  { id: 'diode-decollete', category: 'diode', group: 'Тело', name: 'Декольте', price: 800, duration: 15 },
  { id: 'diode-loins', category: 'diode', group: 'Тело', name: 'Поясница', price: 1500, duration: 20 },
  { id: 'diode-belly-full', category: 'diode', group: 'Тело', name: 'Живот полностью', price: 1990, duration: 20 },
  { id: 'diode-back-full', category: 'diode', group: 'Тело', name: 'Спина полностью', price: 3000, duration: 40 },
  // ── Диодный лазер: зона рук
  { id: 'diode-armpits', category: 'diode', group: 'Зона рук', name: 'Подмышки', price: 800, duration: 15 },
  { id: 'diode-shoulder', category: 'diode', group: 'Зона рук', name: 'Плечо', price: 1000, duration: 20 },
  { id: 'diode-hands', category: 'diode', group: 'Зона рук', name: 'Кисти рук и пальцы', price: 1000, duration: 15 },
  { id: 'diode-forearms', category: 'diode', group: 'Зона рук', name: 'Руки до локтя', price: 1190, duration: 25 },
  { id: 'diode-arms-full', category: 'diode', group: 'Зона рук', name: 'Руки полностью', price: 1990, duration: 35 },
  // ── Диодный лазер: бикини
  { id: 'diode-bikini-line', category: 'diode', group: 'Бикини', name: 'Линия бикини', price: 1000, duration: 15 },
  { id: 'diode-bikini-classic', category: 'diode', group: 'Бикини', name: 'Классическое бикини', price: 1300, duration: 20 },
  { id: 'diode-bikini-total', category: 'diode', group: 'Бикини', name: 'Тотальное бикини', price: 1990, duration: 30 },
  // ── Диодный лазер: ноги
  { id: 'diode-shins', category: 'diode', group: 'Ноги', name: 'Голени (вкл. колени)', price: 1990, duration: 30 },
  { id: 'diode-thighs', category: 'diode', group: 'Ноги', name: 'Бёдра', price: 2000, duration: 30 },
  { id: 'diode-buttocks', category: 'diode', group: 'Ноги', name: 'Ягодицы', price: 2000, duration: 20 },
  { id: 'diode-legs-full', category: 'diode', group: 'Ноги', name: 'Ноги полностью (вкл. пальцы ног)', price: 3990, duration: 60 },
  // ── Диодный лазер: комплексы
  { id: 'diode-combo-m', category: 'diode', group: 'Комплексы', name: 'Комплекс M', note: 'Голени (вкл. колени и пальцы) + тотальное бикини + подмышки в подарок', price: 3980, duration: 60 },
  { id: 'diode-combo-l', category: 'diode', group: 'Комплексы', name: 'Комплекс L', note: 'Ноги полностью + тотальное бикини + подмышки в подарок', price: 5980, duration: 90 },
  { id: 'diode-combo-xl', category: 'diode', group: 'Комплексы', name: 'Комплекс XL', note: 'Всё тело + в подарок любая малая зона + подмышки', price: 7970, duration: 120 },

  // ── Эстетическая косметология
  { id: 'cosm-us-cleaning', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Ультразвуковая чистка + энзимный пилинг', price: 2500, duration: 60 },
  { id: 'cosm-mech-cleaning', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Механическая чистка + энзимный пилинг', price: 2500, duration: 60 },
  { id: 'cosm-combo-cleaning', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Комбинированная чистка + энзимный пилинг', price: 3000, duration: 75 },
  { id: 'cosm-prx', category: 'cosmetology', group: 'Чистки и пилинги', name: 'PRX-T33 пилинг', price: 4000, duration: 45 },
  { id: 'cosm-multiacid', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Мультикислотный пилинг', price: 1500, duration: 40 },
  { id: 'cosm-almond', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Миндальный пилинг', price: 1500, duration: 40 },
  { id: 'cosm-carbo', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Карбо пилинг', price: 1500, duration: 40 },
  { id: 'cosm-beorepeel', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Пилинг BeoRePeel', price: 4000, duration: 45 },
  { id: 'cosm-peachpeel', category: 'cosmetology', group: 'Чистки и пилинги', name: 'Пилинг Peach Peel', price: 4000, duration: 45 },
  { id: 'cosm-biorevit', category: 'cosmetology', group: 'Инъекции', name: 'Биоревитализация', price: 5000, priceFrom: true, duration: 45 },
  { id: 'cosm-mezo-face', category: 'cosmetology', group: 'Инъекции', name: 'Мезотерапия лица', price: 4000, priceFrom: true, duration: 45 },
  { id: 'cosm-mezo-head', category: 'cosmetology', group: 'Инъекции', name: 'Мезотерапия кожи головы', price: 5000, priceFrom: true, duration: 45 },
  { id: 'cosm-carboxy', category: 'cosmetology', group: 'Инъекции', name: 'Карбокситерапия', price: 2000, duration: 30 },
  { id: 'cosm-prp', category: 'cosmetology', group: 'Инъекции', name: 'PRP-терапия (плазмалифтинг)', price: 4000, duration: 60 },
  { id: 'cosm-collagen', category: 'cosmetology', group: 'Инъекции', name: 'Коллагенотерапия (collost micro)', price: 14000, duration: 60 },
  { id: 'cosm-liquid-laser', category: 'cosmetology', group: 'Инъекции', name: 'Жидкий лазер', price: 7000, duration: 45 },

  // ── Интимная косметология
  { id: 'intim-peel', category: 'intimate', group: null, name: 'Пилинг интимной зоны', price: 3000, priceMax: 10000, duration: 45 },
  { id: 'intim-peel-course', category: 'intimate', group: null, name: 'Курс пилинга (3–5 процедур)', price: 7000, priceMax: 40000, duration: 45 },
  { id: 'intim-biorevit', category: 'intimate', group: null, name: 'Биоревитализация интимной зоны', price: 8000, priceMax: 20000, duration: 45 },

  // ── Массаж лица и тела
  { id: 'mass-classic', category: 'massage', group: null, name: 'Классический массаж тела', price: 2600, duration: 70 },
  { id: 'mass-full', category: 'massage', group: null, name: 'Массаж под ключ всего тела и лица', price: 4200, duration: 120 },
  { id: 'mass-back-neck', category: 'massage', group: null, name: 'Массаж спины и шейно-воротниковой зоны', price: 1800, duration: 30 },
  { id: 'mass-deep', category: 'massage', group: null, name: 'Глубокотканный массаж шеи, лица и головы', price: 3100, duration: 90 },
  { id: 'mass-care-face', category: 'massage', group: null, name: 'Уходовый комплекс для лица с массажем', price: 2000, duration: 90 },
  { id: 'mass-buccal', category: 'massage', group: null, name: 'Буккальный массаж лица', price: 3100, duration: 90 },
  { id: 'mass-japan', category: 'massage', group: null, name: '«Японская фейс-практика»', price: 3000, duration: 60 },
  { id: 'mass-thai', category: 'massage', group: null, name: '«Тайское наслаждение»', price: 3000, duration: 90 },
  { id: 'mass-lymph', category: 'massage', group: null, name: 'Лимфодренажный массаж тела', price: 2400, duration: 70 },
  { id: 'mass-lymphdrive', category: 'massage', group: null, name: '«Лимфодрайв»', price: 2600, duration: 70 },

  // ── Ботулинотерапия
  { id: 'botox-brows', category: 'botox', group: null, name: 'Межбровье (морщины гнева)', price: 5000, priceFrom: true, duration: 30 },
  { id: 'botox-eyes', category: 'botox', group: null, name: 'Окологлазничная область (гусиные лапки)', price: 5000, priceFrom: true, duration: 30 },
  { id: 'botox-nose', category: 'botox', group: null, name: 'Крылья носа (морщины кролика)', price: 4000, priceFrom: true, duration: 30 },
  { id: 'botox-browlift', category: 'botox', group: null, name: 'Бровный лифтинг', price: 5000, priceFrom: true, duration: 30 },
  { id: 'botox-hyperhidrosis', category: 'botox', group: null, name: 'Лечение гипергидроза (подмышки, ладони, стопы)', price: 15000, priceFrom: true, duration: 45 },
  { id: 'botox-fullface', category: 'botox', group: null, name: 'Full Face', price: 15000, priceFrom: true, duration: 60 },
  { id: 'botox-platysma', category: 'botox', group: null, name: 'Платизма', price: 7000, priceFrom: true, duration: 40 },
  { id: 'botox-forehead-brows', category: 'botox', group: null, name: 'Лоб + межбровье', price: 8000, priceFrom: true, duration: 40 },
];

// ── Накопительная лояльность ──────────────────────────────────
// Уровень определяется числом завершённых визитов.
export const LOYALTY_TIERS = [
  { minVisits: 0, discount: 0, title: 'Новичок' },
  { minVisits: 3, discount: 3, title: 'Бронза' },
  { minVisits: 7, discount: 5, title: 'Серебро' },
  { minVisits: 12, discount: 7, title: 'Золото' },
  { minVisits: 20, discount: 10, title: 'Платина' },
];

export function loyaltyForVisits(visits) {
  let tier = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) if (visits >= t.minVisits) tier = t;
  const next = LOYALTY_TIERS.find((t) => t.minVisits > visits) || null;
  return { ...tier, visits, next, toNext: next ? next.minVisits - visits : 0 };
}

// ── Статусы записей ───────────────────────────────────────────
export const BOOKING_STATUSES = {
  booked: 'Подтверждена',
  done: 'Завершена',
  cancelled: 'Отменена',
};

export const fmtPrice = (svc) => {
  const base = svc.price.toLocaleString('ru-RU');
  if (svc.priceMax) return `${base} – ${svc.priceMax.toLocaleString('ru-RU')} ₽`;
  if (svc.priceFrom) return `от ${base} ₽`;
  return `${base} ₽`;
};
