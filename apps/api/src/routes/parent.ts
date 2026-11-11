import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { CHILD_AGE_MAX, CHILD_AGE_MIN, DEFAULT_DAILY_MESSAGE_LIMIT } from '@childgpt/shared';
import type { Config } from '../config';
import { requireParent } from '../auth/middleware';
import { KID_COOKIE, PARENT_COOKIE, cookieOptions, signKidToken } from '../auth/tokens';
import { conflict, notFound, parseBody } from '../http/errors';
import { Child, Conversation, Message, SafetyEvent, isObjectId, type ParentDoc } from '../models';
import { childDTO, conversationDTO, messageDTO, safetyEventDTO } from '../services/serializers';
import { dayKey } from '../services/time';

const thisYear = () => new Date().getFullYear();

const childFields = {
  name: z.string().trim().min(1, 'Как зовут ребёнка?').max(30),
  birthYear: z.coerce
    .number()
    .int()
    .refine((y) => y >= thisYear() - CHILD_AGE_MAX && y <= thisYear() - CHILD_AGE_MIN, {
      message: `ChildGPT рассчитан на детей ${CHILD_AGE_MIN}–${CHILD_AGE_MAX} лет`,
    }),
  gender: z.enum(['boy', 'girl']),
  theme: z.enum(['boy', 'girl']).optional(),
  dailyMessageLimit: z.coerce.number().int().min(10).max(300).optional(),
  strictMode: z.boolean().optional(),
};

const createChildSchema = z.object(childFields);
const updateChildSchema = z.object(childFields).partial();

async function ownChild(parent: ParentDoc, id: unknown) {
  if (!isObjectId(id)) throw notFound('Профиль ребёнка не найден');
  const child = await Child.findOne({ _id: id, parentId: parent._id });
  if (!child) throw notFound('Профиль ребёнка не найден');
  return child;
}

export function parentRouter(config: Config) {
  const r = Router();
  r.use(requireParent(config));

  r.get('/overview', async (req: Request, res: Response) => {
    const parent = req.parent!;
    const children = await Child.find({ parentId: parent._id }).sort({ createdAt: 1 });
    const today = dayKey(config.APP_TIMEZONE);
    const [todayConvs, unreviewed, latestEvents] = await Promise.all([
      Conversation.find({ parentId: parent._id, day: today }),
      SafetyEvent.aggregate<{ _id: unknown; count: number; critical: number }>([
        { $match: { parentId: parent._id, reviewedAt: null, severity: { $in: ['warning', 'critical'] } } },
        { $group: { _id: '$childId', count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } } } },
      ]),
      SafetyEvent.find({ parentId: parent._id, severity: { $in: ['warning', 'critical'] } }).sort({ createdAt: -1 }).limit(10),
    ]);
    const names = new Map(children.map((c) => [String(c._id), c.name]));
    res.json({
      children: children.map((c) => {
        const id = String(c._id);
        const conv = todayConvs.find((t) => String(t.childId) === id);
        const alerts = unreviewed.find((u) => String(u._id) === id);
        return {
          ...childDTO(c),
          todayMessages: conv?.childMessageCount ?? 0,
          unreviewedAlerts: alerts?.count ?? 0,
          unreviewedCritical: alerts?.critical ?? 0,
        };
      }),
      events: latestEvents.map((e) => safetyEventDTO(e, names.get(String(e.childId)) ?? '')),
    });
  });

  r.get('/children', async (req: Request, res: Response) => {
    const children = await Child.find({ parentId: req.parent!._id }).sort({ createdAt: 1 });
    res.json({ children: children.map(childDTO) });
  });

  r.post('/children', async (req: Request, res: Response) => {
    const body = parseBody(createChildSchema, req.body);
    const count = await Child.countDocuments({ parentId: req.parent!._id });
    if (count >= 6) throw conflict('Можно добавить до 6 детей', 'children_limit');
    const child = await Child.create({
      parentId: req.parent!._id,
      name: body.name,
      birthYear: body.birthYear,
      gender: body.gender,
      theme: body.theme ?? body.gender,
      dailyMessageLimit: body.dailyMessageLimit ?? DEFAULT_DAILY_MESSAGE_LIMIT,
      strictMode: body.strictMode ?? false,
    });
    res.status(201).json({ child: childDTO(child) });
  });

  r.get('/children/:id', async (req: Request, res: Response) => {
    const child = await ownChild(req.parent!, req.params.id);
    res.json({ child: childDTO(child) });
  });

  r.patch('/children/:id', async (req: Request, res: Response) => {
    const child = await ownChild(req.parent!, req.params.id);
    const body = parseBody(updateChildSchema, req.body);
    child.set(body);
    await child.save();
    res.json({ child: childDTO(child) });
  });

  r.delete('/children/:id', async (req: Request, res: Response) => {
    const child = await ownChild(req.parent!, req.params.id);
    const filter = { childId: child._id };
    await Promise.all([Message.deleteMany(filter), Conversation.deleteMany(filter), SafetyEvent.deleteMany(filter)]);
    await child.deleteOne();
    res.json({ ok: true });
  });

  // Разлогинить ребёнка на всех устройствах.
  r.post('/children/:id/revoke', async (req: Request, res: Response) => {
    const child = await ownChild(req.parent!, req.params.id);
    child.sessionVersion += 1;
    await child.save();
    res.json({ ok: true });
  });

  // Включить детский режим на этом устройстве. В браузере сессия родителя при этом
  // снимается — ребёнок не попадёт в кабинет. Вернуться можно только по PIN.
  r.post('/children/:id/session', async (req: Request, res: Response) => {
    const parent = req.parent!;
    if (!parent.pinHash) throw conflict('Сначала задайте PIN для выхода из детского режима', 'pin_required');
    const child = await ownChild(parent, req.params.id);
    const { device } = parseBody(z.object({ device: z.enum(['web', 'mobile']).default('web') }), req.body);
    const token = await signKidToken(config.AUTH_SECRET, String(child._id), String(parent._id), child.sessionVersion);
    if (device === 'web') {
      res.cookie(KID_COOKIE, token, cookieOptions(config.isProd, 'kid'));
      res.clearCookie(PARENT_COOKIE, { path: '/' });
    }
    res.json({ token, child: childDTO(child) });
  });

  r.get('/children/:id/conversations', async (req: Request, res: Response) => {
    const child = await ownChild(req.parent!, req.params.id);
    const conversations = await Conversation.find({ childId: child._id, messageCount: { $gt: 0 } }).sort({ day: -1 }).limit(90);
    res.json({ conversations: conversations.map(conversationDTO) });
  });

  r.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    if (!isObjectId(req.params.id)) throw notFound('Разговор не найден');
    const conv = await Conversation.findOne({ _id: req.params.id, parentId: req.parent!._id });
    if (!conv) throw notFound('Разговор не найден');
    const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(1000);
    res.json({ conversation: conversationDTO(conv), messages: messages.map((m) => messageDTO(m, 'parent')) });
  });

  r.get('/safety-events', async (req: Request, res: Response) => {
    const q = parseBody(
      z.object({ childId: z.string().optional(), unreviewed: z.enum(['1', '0']).optional(), includeInfo: z.enum(['1', '0']).optional() }),
      req.query,
    );
    const filter: Record<string, unknown> = { parentId: req.parent!._id };
    if (q.childId) filter.childId = (await ownChild(req.parent!, q.childId))._id;
    if (q.unreviewed === '1') filter.reviewedAt = null;
    if (q.includeInfo !== '1') filter.severity = { $in: ['warning', 'critical'] };
    const [events, children] = await Promise.all([
      SafetyEvent.find(filter).sort({ createdAt: -1 }).limit(200),
      Child.find({ parentId: req.parent!._id }, { name: 1 }),
    ]);
    const names = new Map(children.map((c) => [String(c._id), c.name]));
    res.json({ events: events.map((e) => safetyEventDTO(e, names.get(String(e.childId)) ?? '')) });
  });

  r.post('/safety-events/:id/review', async (req: Request, res: Response) => {
    if (!isObjectId(req.params.id)) throw notFound();
    const result = await SafetyEvent.updateOne({ _id: req.params.id, parentId: req.parent!._id }, { $set: { reviewedAt: new Date() } });
    if (result.matchedCount === 0) throw notFound();
    res.json({ ok: true });
  });

  return r;
}
