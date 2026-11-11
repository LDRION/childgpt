import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { MESSAGE_MAX_LENGTH, PIN_LENGTH } from '@childgpt/shared';
import type { Config } from '../config';
import { requireKid } from '../auth/middleware';
import { verifySecret } from '../auth/password';
import { KID_COOKIE } from '../auth/tokens';
import { HttpError, parseBody } from '../http/errors';
import { Parent } from '../models';
import type { ChatService } from '../services/chat';
import { kidProfileDTO } from '../services/serializers';
import { issueParentSession } from './auth';

const PIN_MAX_FAILURES = 5;
const PIN_LOCK_MS = 15 * 60 * 1000;

export function kidRouter(config: Config, chat: ChatService) {
  const r = Router();
  r.use(requireKid(config));

  // Лимит сообщений в минуту на ребёнка: и защита от «зажатой кнопки»,
  // и бережём лимит языковой модели.
  const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: config.KID_MESSAGES_PER_MINUTE,
    keyGenerator: (req) => `kid:${String(req.child?._id)}`,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Ой, слишком быстро! Давай чуть помедленнее 🦉', code: 'rate_limited' },
  });

  r.get('/me', (req: Request, res: Response) => {
    res.json({ child: kidProfileDTO(req.child!) });
  });

  r.get('/messages', async (req: Request, res: Response) => {
    res.json({ messages: await chat.todayMessages(req.child!) });
  });

  r.post('/messages', messageLimiter, async (req: Request, res: Response) => {
    const { text } = parseBody(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, 'Напиши что-нибудь')
          .max(MESSAGE_MAX_LENGTH, `Слишком длинно — до ${MESSAGE_MAX_LENGTH} символов`),
      }),
      req.body,
    );
    res.json(await chat.send(req.child!, text));
  });

  // Выход из детского режима — по PIN родителя или (если PIN забыт) по паролю аккаунта.
  // Ошибки обоих видов считаются вместе: после 5 — пауза 15 минут.
  r.post('/exit', async (req: Request, res: Response) => {
    const body = parseBody(
      z
        .object({
          pin: z.string().regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), 'Введите PIN').optional(),
          password: z.string().min(1).max(128).optional(),
        })
        .refine((b) => Boolean(b.pin) !== Boolean(b.password), { message: 'Введите PIN или пароль' }),
      req.body,
    );
    const parent = await Parent.findById(req.child!.parentId);
    if (!parent) throw new HttpError(401, 'Аккаунт не найден', 'unauthorized');
    if (body.pin && !parent.pinHash) throw new HttpError(409, 'PIN не задан', 'pin_required');

    if (parent.pinLockedUntil && parent.pinLockedUntil.getTime() > Date.now()) {
      throw new HttpError(429, 'Слишком много попыток. Попробуйте через 15 минут.', 'pin_locked');
    }

    const ok = body.pin ? await verifySecret(body.pin, parent.pinHash!) : await verifySecret(body.password!, parent.passwordHash);
    if (!ok) {
      parent.pinFailures += 1;
      if (parent.pinFailures >= PIN_MAX_FAILURES) {
        parent.pinFailures = 0;
        parent.pinLockedUntil = new Date(Date.now() + PIN_LOCK_MS);
      }
      await parent.save();
      throw new HttpError(401, body.pin ? 'Неверный PIN' : 'Неверный пароль', body.pin ? 'bad_pin' : 'bad_password');
    }

    parent.pinFailures = 0;
    parent.pinLockedUntil = null;
    await parent.save();
    res.clearCookie(KID_COOKIE, { path: '/' });
    const token = await issueParentSession(config, res, parent);
    res.json({ ok: true, token });
  });

  return r;
}
