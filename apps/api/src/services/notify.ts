import nodemailer, { type Transporter } from 'nodemailer';
import { SAFETY_CATEGORY_LABELS, type SafetyCategory } from '@childgpt/shared';
import type { Config } from '../config';
import type { Logger } from '../logger';

// Письмо родителю о критическом событии. Содержимое переписки в письмо НЕ кладём —
// только категорию и ссылку в кабинет: почта — менее защищённый канал.

const THROTTLE_MS = 10 * 60 * 1000;

export interface Notifier {
  criticalEvent(input: { to: string; parentName: string; childName: string; childId: string; category: SafetyCategory }): void;
}

export function createNotifier(config: Config, logger: Logger): Notifier {
  const transport: Transporter | null = config.SMTP_URL ? nodemailer.createTransport(config.SMTP_URL) : null;
  const lastSent = new Map<string, number>();

  return {
    criticalEvent({ to, parentName, childName, childId, category }) {
      const key = `${childId}:${category}`;
      const now = Date.now();
      if ((lastSent.get(key) ?? 0) > now - THROTTLE_MS) return;
      lastSent.set(key, now);

      const link = `${config.APP_URL}/parent/children/${childId}`;
      const label = SAFETY_CATEGORY_LABELS[category] ?? 'Важное событие';
      const text = [
        `${parentName}, здравствуйте!`,
        ``,
        `В разговоре ${childName} с Луми сработала защита: «${label}».`,
        `Ребёнок получил бережный ответ и контакты Детского телефона доверия. Пожалуйста, поговорите с ребёнком.`,
        ``,
        `Подробности в кабинете: ${link}`,
        ``,
        `— ChildGPT`,
      ].join('\n');

      if (!transport) {
        logger.warn({ childId, category }, 'critical event: SMTP не настроен, письмо не отправлено');
        return;
      }
      transport
        .sendMail({ from: config.MAIL_FROM, to, subject: `ChildGPT: важно — ${childName}`, text })
        .catch((err: unknown) => logger.error({ err, childId }, 'не удалось отправить письмо родителю'));
    },
  };
}
