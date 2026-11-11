export const PRODUCT_NAME = 'ChildGPT';
export const MASCOT_NAME = 'Луми';
export const SITE_URL = 'https://childgpt.ru';
export const SUPPORT_EMAIL = 'support@childgpt.ru';

export const CHILD_AGE_MIN = 5;
export const CHILD_AGE_MAX = 13;

export const MESSAGE_MAX_LENGTH = 500;
export const DEFAULT_DAILY_MESSAGE_LIMIT = 120;
export const PIN_LENGTH = 4;

// Номера, которые получает ребёнок в кризисной ситуации. Только проверенные
// федеральные линии — никаких коммерческих «горячих линий».
export const CHILD_HELPLINE = {
  name: 'Детский телефон доверия',
  phone: '8-800-2000-122',
  tel: '+78002000122',
  note: 'бесплатно, анонимно, круглосуточно',
} as const;

export const EMERGENCY_PHONE = '112';

// Версии юридических документов: при изменении текста — поднять версию,
// чтобы новое согласие родителя фиксировалось отдельной записью.
export const LEGAL_VERSIONS = {
  terms: '2026-10-23',
  privacy: '2026-10-23',
  childData: '2026-10-23',
} as const;
