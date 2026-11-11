import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { LEGAL_VERSIONS, PIN_LENGTH } from '@childgpt/shared';
import type { Config } from '../config';
import { hashSecret, verifySecret, verifySecretConstantTime } from '../auth/password';
import { requireParent } from '../auth/middleware';
import { KID_COOKIE, PARENT_COOKIE, cookieOptions, signParentToken } from '../auth/tokens';
import { HttpError, badRequest, conflict, parseBody, unauthorized } from '../http/errors';
import { Child, Consent, Conversation, Message, Parent, SafetyEvent, type ParentDoc } from '../models';
import { parentDTO } from '../services/serializers';

const email = z.string().trim().toLowerCase().email('Укажите корректный email').max(254);
const password = z.string().min(8, 'Пароль — минимум 8 символов').max(128);
const pin = z.string().regex(new RegExp(`^\\d{${PIN_LENGTH}}$`), `PIN — ровно ${PIN_LENGTH} цифры`);

const registerSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1, 'Как к вам обращаться?').max(60),
  consents: z.object({
    terms: z.literal(true, { errorMap: () => ({ message: 'Нужно принять условия' }) }),
    privacy: z.literal(true, { errorMap: () => ({ message: 'Нужно принять политику' }) }),
    childData: z.literal(true, { errorMap: () => ({ message: 'Нужно согласие на обработку данных ребёнка' }) }),
  }),
});

const loginSchema = z.object({ email, password: z.string().min(1).max(128) });

export async function issueParentSession(config: Config, res: Response, parent: ParentDoc) {
  const token = await signParentToken(config.AUTH_SECRET, String(parent._id), parent.tokenVersion);
  res.cookie(PARENT_COOKIE, token, cookieOptions(config.isProd, 'parent'));
  res.clearCookie(KID_COOKIE, { path: '/' });
  return token;
}

export function authRouter(config: Config) {
  const r = Router();
  const auth = requireParent(config);
  const credentialsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.NODE_ENV === 'test' ? 1000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много попыток. Попробуйте через 15 минут.', code: 'rate_limited' },
  });

  r.post('/register', credentialsLimiter, async (req: Request, res: Response) => {
    const body = parseBody(registerSchema, req.body);
    if (await Parent.exists({ email: body.email })) throw conflict('Аккаунт с таким email уже есть', 'email_taken');

    const parent = await Parent.create({ email: body.email, name: body.name, passwordHash: await hashSecret(body.password) });
    const meta = { parentId: parent._id, ip: req.ip ?? null, userAgent: req.get('user-agent')?.slice(0, 300) ?? null };
    await Consent.insertMany([
      { ...meta, kind: 'terms', version: LEGAL_VERSIONS.terms },
      { ...meta, kind: 'privacy', version: LEGAL_VERSIONS.privacy },
      { ...meta, kind: 'child_data', version: LEGAL_VERSIONS.childData },
    ]);

    const token = await issueParentSession(config, res, parent);
    res.status(201).json({ parent: parentDTO(parent), token });
  });

  r.post('/login', credentialsLimiter, async (req: Request, res: Response) => {
    const body = parseBody(loginSchema, req.body);
    const parent = await Parent.findOne({ email: body.email });
    const ok = await verifySecretConstantTime(body.password, parent?.passwordHash);
    if (!parent || !ok) throw unauthorized('Неверный email или пароль');
    const token = await issueParentSession(config, res, parent);
    res.json({ parent: parentDTO(parent), token });
  });

  r.post('/logout', (_req: Request, res: Response) => {
    res.clearCookie(PARENT_COOKIE, { path: '/' });
    res.clearCookie(KID_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  r.get('/me', auth, (req: Request, res: Response) => {
    res.json({ parent: parentDTO(req.parent!) });
  });

  r.patch('/me', auth, async (req: Request, res: Response) => {
    const body = parseBody(
      z.object({ name: z.string().trim().min(1).max(60).optional(), notifyByEmail: z.boolean().optional() }),
      req.body,
    );
    const parent = req.parent!;
    if (body.name !== undefined) parent.name = body.name;
    if (body.notifyByEmail !== undefined) parent.notifyByEmail = body.notifyByEmail;
    await parent.save();
    res.json({ parent: parentDTO(parent) });
  });

  // PIN для выхода из детского режима. Менять — только с подтверждением паролем.
  r.put('/pin', auth, async (req: Request, res: Response) => {
    const body = parseBody(z.object({ pin, password: z.string().min(1) }), req.body);
    const parent = req.parent!;
    if (!(await verifySecret(body.password, parent.passwordHash))) throw new HttpError(400, 'Неверный пароль', 'bad_password', { password: 'Неверный пароль' });
    parent.pinHash = await hashSecret(body.pin);
    parent.pinFailures = 0;
    parent.pinLockedUntil = null;
    await parent.save();
    res.json({ parent: parentDTO(parent) });
  });

  r.post('/password', auth, async (req: Request, res: Response) => {
    const body = parseBody(z.object({ current: z.string().min(1), next: password }), req.body);
    const parent = req.parent!;
    if (!(await verifySecret(body.current, parent.passwordHash))) throw new HttpError(400, 'Неверный пароль', 'bad_password', { current: 'Неверный пароль' });
    parent.passwordHash = await hashSecret(body.next);
    parent.tokenVersion += 1;
    await parent.save();
    const token = await issueParentSession(config, res, parent);
    res.json({ parent: parentDTO(parent), token });
  });

  // Полное удаление аккаунта и всех данных детей (право на удаление, 152-ФЗ).
  r.delete('/me', auth, async (req: Request, res: Response) => {
    const body = parseBody(z.object({ password: z.string().min(1) }), req.body);
    const parent = req.parent!;
    if (!(await verifySecret(body.password, parent.passwordHash))) throw badRequest('Неверный пароль', 'bad_password');
    const filter = { parentId: parent._id };
    await Promise.all([
      Message.deleteMany(filter),
      Conversation.deleteMany(filter),
      SafetyEvent.deleteMany(filter),
      Child.deleteMany(filter),
      Consent.deleteMany(filter),
    ]);
    await parent.deleteOne();
    res.clearCookie(PARENT_COOKIE, { path: '/' });
    res.clearCookie(KID_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  return r;
}
