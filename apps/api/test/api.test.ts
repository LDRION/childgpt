import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CHILD_HELPLINE } from '@childgpt/shared';
import type { LlmClient } from '@childgpt/safety';
import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { createMockClient } from '../src/llm/mock';
import type { Notifier } from '../src/services/notify';

const ORIGIN = 'http://localhost:3000';
let mongo: MongoMemoryServer;
let llm: LlmClient;
const sentAlerts: unknown[] = [];

const config = loadConfig({
  NODE_ENV: 'test',
  AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
  WEB_ORIGINS: ORIGIN,
  LLM_PROVIDER: 'mock',
  KID_MESSAGES_PER_MINUTE: '1000',
} as NodeJS.ProcessEnv);

const notifier: Notifier = { criticalEvent: (e) => sentAlerts.push(e) };
const app = () => createApp({ config, llm, notifier });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  llm = createMockClient();
  sentAlerts.length = 0;
  await mongoose.connection.db!.dropDatabase();
});

async function registerParent(server = app(), email = 'mama@example.com') {
  const res = await request(server)
    .post('/api/auth/register')
    .send({ email, password: 'strongpass1', name: 'Анна', consents: { terms: true, privacy: true, childData: true } })
    .expect(201);
  return { server, token: res.body.token as string, cookies: res.headers['set-cookie'] as unknown as string[] };
}

async function setupKid() {
  const { server, token } = await registerParent();
  const auth = { Authorization: `Bearer ${token}` };
  await request(server).put('/api/auth/pin').set(auth).send({ pin: '1234', password: 'strongpass1' }).expect(200);
  const child = await request(server)
    .post('/api/parent/children')
    .set(auth)
    .send({ name: 'Маша', birthYear: new Date().getFullYear() - 8, gender: 'girl' })
    .expect(201);
  const session = await request(server).post(`/api/parent/children/${child.body.child.id}/session`).set(auth).send({ device: 'mobile' }).expect(200);
  return { server, auth, childId: child.body.child.id as string, kid: { Authorization: `Bearer ${session.body.token}` } };
}

describe('регистрация и вход родителя', () => {
  it('требует все три согласия', async () => {
    const res = await request(app())
      .post('/api/auth/register')
      .send({ email: 'a@b.ru', password: 'strongpass1', name: 'А', consents: { terms: true, privacy: true, childData: false } })
      .expect(400);
    expect(res.body.fields['consents.childData']).toBeTruthy();
  });

  it('регистрирует, ставит httpOnly-cookie и пускает в кабинет', async () => {
    const { server, cookies } = await registerParent();
    expect(cookies.join(';')).toMatch(/cg_parent=.*HttpOnly/i);
    const me = await request(server).get('/api/auth/me').set('Cookie', cookies).expect(200);
    expect(me.body.parent).toMatchObject({ email: 'mama@example.com', hasPin: false });
  });

  it('не пускает с неверным паролем и не раскрывает, есть ли email', async () => {
    const { server } = await registerParent();
    const a = await request(server).post('/api/auth/login').send({ email: 'mama@example.com', password: 'wrong-pass' }).expect(401);
    const b = await request(server).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'wrong-pass' }).expect(401);
    expect(a.body.error).toBe(b.body.error);
  });

  it('CSRF: изменяющий запрос по cookie с чужого сайта отклоняется', async () => {
    const { server, cookies } = await registerParent();
    await request(server)
      .post('/api/parent/children')
      .set('Cookie', cookies)
      .set('Origin', 'https://evil.example')
      .send({ name: 'X', birthYear: 2017, gender: 'boy' })
      .expect(403);
    await request(server)
      .post('/api/parent/children')
      .set('Cookie', cookies)
      .set('Origin', ORIGIN)
      .send({ name: 'X', birthYear: new Date().getFullYear() - 9, gender: 'boy' })
      .expect(201);
  });
});

describe('детский режим', () => {
  it('без PIN включить детский режим нельзя', async () => {
    const { server, token } = await registerParent();
    const auth = { Authorization: `Bearer ${token}` };
    const child = await request(server).post('/api/parent/children').set(auth).send({ name: 'Петя', birthYear: new Date().getFullYear() - 7, gender: 'boy' });
    const res = await request(server).post(`/api/parent/children/${child.body.child.id}/session`).set(auth).send({}).expect(409);
    expect(res.body.code).toBe('pin_required');
  });

  it('проверяет возраст ребёнка', async () => {
    const { server, token } = await registerParent();
    await request(server)
      .post('/api/parent/children')
      .set({ Authorization: `Bearer ${token}` })
      .send({ name: 'Вася', birthYear: new Date().getFullYear() - 16, gender: 'boy' })
      .expect(400);
  });

  it('токен ребёнка не открывает кабинет родителя', async () => {
    const { server, kid } = await setupKid();
    await request(server).get('/api/parent/children').set(kid).expect(401);
    await request(server).get('/api/auth/me').set(kid).expect(401);
  });

  it('веб: вход в детский режим снимает сессию родителя', async () => {
    const { server, cookies } = await registerParent();
    await request(server).put('/api/auth/pin').set('Cookie', cookies).set('Origin', ORIGIN).send({ pin: '1234', password: 'strongpass1' }).expect(200);
    const child = await request(server)
      .post('/api/parent/children')
      .set('Cookie', cookies)
      .set('Origin', ORIGIN)
      .send({ name: 'Маша', birthYear: new Date().getFullYear() - 8, gender: 'girl' });
    const res = await request(server).post(`/api/parent/children/${child.body.child.id}/session`).set('Cookie', cookies).set('Origin', ORIGIN).send({ device: 'web' });
    const set = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(set).toMatch(/cg_kid=[^;]+/);
    expect(set).toMatch(/cg_parent=;/);
  });

  it('обычный вопрос → ответ Луми; родитель видит переписку с метками защиты', async () => {
    const { server, auth, kid, childId } = await setupKid();
    const res = await request(server).post('/api/kid/messages').set(kid).send({ text: 'Почему небо голубое?' }).expect(200);
    expect(res.body.message.role).toBe('lumi');
    expect(res.body.message.safety).toBeUndefined();

    const history = await request(server).get('/api/kid/messages').set(kid).expect(200);
    expect(history.body.messages).toHaveLength(2);

    const convs = await request(server).get(`/api/parent/children/${childId}/conversations`).set(auth).expect(200);
    const transcript = await request(server).get(`/api/parent/conversations/${convs.body.conversations[0].id}/messages`).set(auth).expect(200);
    expect(transcript.body.messages[0]).toMatchObject({ role: 'child', text: 'Почему небо голубое?', safety: { action: 'allowed' } });
  });

  it('кризис → телефон доверия ребёнку, критическое событие и письмо родителю', async () => {
    const { server, auth, kid } = await setupKid();
    const res = await request(server).post('/api/kid/messages').set(kid).send({ text: 'я не хочу больше жить' }).expect(200);
    expect(res.body.message.text).toContain(CHILD_HELPLINE.phone);

    const events = await request(server).get('/api/parent/safety-events').set(auth).expect(200);
    expect(events.body.events[0]).toMatchObject({ severity: 'critical', category: 'crisis_self_harm', reviewed: false, childName: 'Маша' });
    expect(sentAlerts).toHaveLength(1);

    const overview = await request(server).get('/api/parent/overview').set(auth).expect(200);
    expect(overview.body.children[0]).toMatchObject({ unreviewedCritical: 1, todayMessages: 1 });

    await request(server).post(`/api/parent/safety-events/${events.body.events[0].id}/review`).set(auth).expect(200);
    const after = await request(server).get('/api/parent/overview').set(auth).expect(200);
    expect(after.body.children[0].unreviewedCritical).toBe(0);
  });

  it('личные данные не уходят в модель, но видны родителю', async () => {
    const prompts: string[] = [];
    const base = createMockClient();
    llm = { complete: (req) => (prompts.push(req.prompt), base.complete(req)) };
    const { server, auth, kid, childId } = await setupKid();
    await request(server).post('/api/kid/messages').set(kid).send({ text: 'мой номер 89161234567' }).expect(200);
    expect(prompts.join('\n')).not.toContain('89161234567');

    const convs = await request(server).get(`/api/parent/children/${childId}/conversations`).set(auth);
    const transcript = await request(server).get(`/api/parent/conversations/${convs.body.conversations[0].id}/messages`).set(auth);
    expect(transcript.body.messages[0].text).toContain('89161234567');
    expect(transcript.body.messages[0].safety.redactedPersonalData).toBe(true);
  });

  it('сбой модели → безопасная заглушка, а не ошибка', async () => {
    llm = {
      complete: async () => {
        throw new Error('провайдер упал');
      },
    };
    const { server, kid } = await setupKid();
    const res = await request(server).post('/api/kid/messages').set(kid).send({ text: 'расскажи сказку' }).expect(200);
    expect(res.body.message.text).toBeTruthy();
  });

  it('дневной лимит сообщений', async () => {
    const { server, auth, kid, childId } = await setupKid();
    await request(server).patch(`/api/parent/children/${childId}`).set(auth).send({ dailyMessageLimit: 10 }).expect(200);
    for (let i = 0; i < 10; i += 1) {
      await request(server).post('/api/kid/messages').set(kid).send({ text: `вопрос ${i}` }).expect(200);
    }
    const res = await request(server).post('/api/kid/messages').set(kid).send({ text: 'ещё вопрос' }).expect(200);
    expect(res.body.limited).toBe(true);
    expect(res.body.message.text).toContain('Возвращайся завтра');
  });

  it('выход по PIN: неверный PIN отклоняется, после 5 ошибок — блокировка', async () => {
    const { server, kid } = await setupKid();
    for (let i = 0; i < 4; i += 1) await request(server).post('/api/kid/exit').set(kid).send({ pin: '0000' }).expect(401);
    await request(server).post('/api/kid/exit').set(kid).send({ pin: '0000' }).expect(401);
    await request(server).post('/api/kid/exit').set(kid).send({ pin: '1234' }).expect(429);
  });

  it('выход по верному PIN возвращает сессию родителя', async () => {
    const { server, kid } = await setupKid();
    const res = await request(server).post('/api/kid/exit').set(kid).send({ pin: '1234' }).expect(200);
    await request(server).get('/api/auth/me').set({ Authorization: `Bearer ${res.body.token}` }).expect(200);
  });

  it('если PIN забыт — выход по паролю родителя', async () => {
    const { server, kid } = await setupKid();
    await request(server).post('/api/kid/exit').set(kid).send({ password: 'wrong' }).expect(401);
    const res = await request(server).post('/api/kid/exit').set(kid).send({ password: 'strongpass1' }).expect(200);
    expect(res.body.token).toBeTruthy();
  });

  it('«выйти на всех устройствах» отзывает токен ребёнка', async () => {
    const { server, auth, kid, childId } = await setupKid();
    await request(server).post(`/api/parent/children/${childId}/revoke`).set(auth).expect(200);
    await request(server).get('/api/kid/me').set(kid).expect(401);
  });
});

describe('изоляция данных', () => {
  it('родитель не видит чужих детей', async () => {
    const { server, childId } = await setupKid();
    const other = await registerParent(server, 'papa@example.com');
    await request(server).get(`/api/parent/children/${childId}`).set({ Authorization: `Bearer ${other.token}` }).expect(404);
  });

  it('удаление аккаунта стирает все данные детей', async () => {
    const { server, auth, kid } = await setupKid();
    await request(server).post('/api/kid/messages').set(kid).send({ text: 'привет' }).expect(200);
    await request(server).delete('/api/auth/me').set(auth).send({ password: 'strongpass1' }).expect(200);
    const db = mongoose.connection.db!;
    for (const c of ['parents', 'children', 'messages', 'conversations', 'consents']) {
      expect(await db.collection(c).countDocuments()).toBe(0);
    }
    await request(server).get('/api/kid/me').set(kid).expect(401);
  });
});
