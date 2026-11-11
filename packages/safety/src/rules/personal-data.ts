// Личные данные ребёнка не должны уходить во внешнюю модель. Всё, что похоже на
// контакт, адрес, школу, пароль, — заменяется плейсхолдером ДО вызова модели.
// Исходный текст остаётся только в нашей базе и виден только родителю.

export type PersonalDataKind = 'email' | 'phone' | 'card' | 'document' | 'address' | 'school' | 'password' | 'surname' | 'handle';
export type RedactionKind = PersonalDataKind | 'link';

interface Redactor {
  kind: RedactionKind;
  pattern: RegExp;
  replace: string | ((match: string, ...groups: string[]) => string);
  validate?: (match: string) => boolean;
}

function luhnValid(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

const STREET = '(?:улиц[аеуыой]{0,2}|ул\\.|проспект[а-яё]*|пр-т|переул[а-яё]*|пер\\.|шоссе|бульвар[а-яё]*|б-р|площад[а-яё]*|набережн[а-яё]*|микрорайон[а-яё]*|мкр\\.?)';
const SCHOOL = '(?:школ[аеуыой]{0,3}|гимнази[яиюей]{0,2}|лице[йяею]{0,2}|садик[аеу]?|детск(?:ий|ом) сад[уе]?)';

const REDACTORS: Redactor[] = [
  { kind: 'email', pattern: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, replace: '[почта скрыта]' },
  { kind: 'link', pattern: /\b(?:https?:\/\/|www\.)\S+/gi, replace: '[ссылка убрана]' },
  {
    kind: 'link',
    pattern: /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ru|com|net|org|io|me|tv|gg|xyz|su|online|app|link|info|biz|club|site)\b(?:\/\S*)?/gi,
    replace: '[ссылка убрана]',
  },
  { kind: 'handle', pattern: /(?<![\w@])@[A-Za-z0-9_]{4,32}\b/g, replace: '[ник скрыт]' },
  { kind: 'card', pattern: /(?<!\d)(?:\d[ -]?){13,19}(?!\d)/g, replace: '[номер карты скрыт]', validate: luhnValid },
  { kind: 'document', pattern: /(?<!\d)\d{3}-\d{3}-\d{3}[ -]?\d{2}(?!\d)/g, replace: '[номер документа скрыт]' },
  {
    kind: 'phone',
    pattern: /(?<!\d)(?:\+\s?7|8|7)?[\s\-–(]*\d{3}[\s\-–)]*\d{3}[\s\-–]*\d{2}[\s\-–]*\d{2}(?!\d)/g,
    replace: '[телефон скрыт]',
  },
  {
    kind: 'address',
    pattern: new RegExp(
      `${STREET}\\s+[а-яёa-z0-9.\\- ]{2,30}?,?\\s*(?:д(?:ом)?\\.?\\s*)?\\d+[а-яё]?(?:\\s*,?\\s*(?:корп(?:ус)?\\.?|к\\.)\\s*\\d+)?(?:\\s*,?\\s*(?:кв(?:артира)?\\.?)\\s*\\d+)?`,
      'gi',
    ),
    replace: '[адрес скрыт]',
  },
  {
    kind: 'address',
    pattern: /(?:дом|д\.)\s*\d+[а-яё]?\s*,?\s*(?:подъезд\s*\d+\s*,?\s*)?(?:кв(?:артира)?\.?|квартира)\s*\d+/gi,
    replace: '[адрес скрыт]',
  },
  {
    kind: 'address',
    pattern: new RegExp(`((?:я |мы )?(?:живу|живем|живём|мой адрес|наш адрес)[^.!?\\n]{0,10}?)(${STREET}[^.!?\\n]{0,40})`, 'gi'),
    replace: (_m, lead: string) => `${lead}[адрес скрыт]`,
  },
  {
    // «школа №15», «учусь в школе 15.» — но не «в школе 300 учеников» из задачи.
    kind: 'school',
    pattern: new RegExp(`(${SCHOOL}\\s*)(?:(?:№|номер|n|#)\\s*\\d+|\\d+(?=\\s*(?:[,.!?;)]|$)))`, 'gi'),
    replace: (_m, lead: string) => `${lead}[номер скрыт]`,
  },
  {
    kind: 'school',
    pattern: /(?<!\d)\d+(?:\s*-?\s*(?:й|я|ой|ая|ую|ом))?(\s+(?:школ[аеуыой]{0,3}|гимнази[яиюей]{0,2}|лице[йяею]{0,2}))/gi,
    replace: (_m, tail: string) => `[номер скрыт]${tail}`,
  },
  {
    kind: 'password',
    pattern: /((?:пароль|password|пасворд|пин-?код)(?:\s+от\s+[^\s:]+)?\s*(?:[:\-—=]|такой|это)\s*)\S+/gi,
    replace: (_m, lead: string) => `${lead}[скрыт]`,
  },
  {
    kind: 'password',
    pattern: /((?:мой|наш)\s+(?:пароль|пин-?код)(?:\s+от\s+[^\s:]+)?\s+)(?!(?:это|такой)(?![а-яё])|[:\-—=])\S+/gi,
    replace: (_m, lead: string) => `${lead}[скрыт]`,
  },
  {
    kind: 'surname',
    pattern: /((?:моя фамилия|фамилия у меня|наша фамилия)\s*[:\-—]?\s*)[а-яёa-z-]{2,}/gi,
    replace: (_m, lead: string) => `${lead}[скрыта]`,
  },
];

export interface RedactionResult {
  text: string;
  kinds: RedactionKind[];
}

function applyRedactor(text: string, r: Redactor, onHit: (kind: RedactionKind) => void): string {
  return text.replace(r.pattern, (match: string, ...rest: unknown[]) => {
    if (r.validate && !r.validate(match)) return match;
    onHit(r.kind);
    if (typeof r.replace === 'string') return r.replace;
    const groups = rest.filter((g): g is string => typeof g === 'string');
    return r.replace(match, ...groups);
  });
}

export function redactPersonalData(text: string): RedactionResult {
  const kinds = new Set<RedactionKind>();
  let out = text;
  for (const r of REDACTORS) out = applyRedactor(out, r, (k) => kinds.add(k));
  return { text: out, kinds: [...kinds] };
}

export function isPersonalData(kind: RedactionKind): kind is PersonalDataKind {
  return kind !== 'link';
}

const HELPLINE_DIGITS = new Set(['88002000122', '78002000122']);
const OUTPUT_STRIP: RedactionKind[] = ['email', 'link', 'handle', 'phone'];

/**
 * Очистка ответа модели перед показом ребёнку: никаких ссылок, почт, ников и телефонов,
 * кроме телефона доверия. Markdown-разметку упрощаем до простого текста.
 */
export function sanitizeModelOutput(text: string): { text: string; removed: RedactionKind[] } {
  const removed = new Set<RedactionKind>();
  let out = text
    .replace(/\r\n/g, '\n')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  for (const r of REDACTORS) {
    if (!OUTPUT_STRIP.includes(r.kind)) continue;
    out = out.replace(r.pattern, (match: string) => {
      if (r.kind === 'phone' && HELPLINE_DIGITS.has(match.replace(/\D/g, ''))) return match;
      removed.add(r.kind);
      return '';
    });
  }

  out = out
    .replace(/(?<![a-zа-яё])(?:siberi|сибери)(?:\s*\.?\s*ai)?(?![a-zа-яё])/gi, 'Луми')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return { text: out, removed: [...removed] };
}
