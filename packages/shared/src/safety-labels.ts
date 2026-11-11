import type { SafetyCategory, SafetySeverity } from './types';

export const SAFETY_CATEGORY_LABELS: Record<SafetyCategory, string> = {
  crisis_self_harm: 'Мысли о причинении себе вреда',
  crisis_abuse: 'Возможное насилие или жестокое обращение',
  contact_stranger: 'Контакт с незнакомцем',
  bullying: 'Травля, обиды',
  sexual: 'Взрослая тема',
  violence: 'Насилие',
  weapons: 'Оружие',
  drugs: 'Наркотики',
  alcohol_tobacco: 'Алкоголь, курение',
  extremism: 'Экстремизм, терроризм',
  hate: 'Оскорбления по признаку группы',
  profanity: 'Нецензурная лексика',
  gambling: 'Азартные игры',
  dangerous_activity: 'Опасные действия',
  medical: 'Здоровье и лекарства',
  scary: 'Пугающий контент',
  personal_data: 'Личные данные',
  jailbreak: 'Попытка обойти правила',
  off_platform: 'Ссылки и сторонние сервисы',
  other: 'Другое',
  system_error: 'Технический сбой (показан безопасный ответ)',
};

export const SAFETY_SEVERITY_LABELS: Record<SafetySeverity, string> = {
  info: 'Для сведения',
  warning: 'Стоит обратить внимание',
  critical: 'Важно: поговорите с ребёнком',
};
