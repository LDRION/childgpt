import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/childgpt'),
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET должен быть не короче 32 символов'),
    WEB_ORIGINS: z.string().default('http://localhost:3000'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    APP_TIMEZONE: z.string().default('Europe/Moscow'),
    LLM_PROVIDER: z.enum(['siberi', 'mock']).default('mock'),
    SIBERI_API_KEY: z.string().optional(),
    SIBERI_BASE_URL: z.string().url().default('https://siberi.online/api/v1/ai'),
    SAFETY_INPUT_JUDGE: z.enum(['always', 'on_signal']).default('always'),
    KID_MESSAGES_PER_MINUTE: z.coerce.number().int().positive().default(10),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().default('ChildGPT <no-reply@childgpt.ru>'),
  })
  .superRefine((env, ctx) => {
    if (env.LLM_PROVIDER === 'siberi' && !env.SIBERI_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['SIBERI_API_KEY'], message: 'нужен при LLM_PROVIDER=siberi' });
    }
    if (env.NODE_ENV === 'production' && env.LLM_PROVIDER === 'mock') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['LLM_PROVIDER'], message: 'mock запрещён в production' });
    }
  });

export type Config = z.infer<typeof schema> & { webOrigins: string[]; isProd: boolean };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Некорректная конфигурация окружения:\n${details}`);
  }
  return {
    ...parsed.data,
    webOrigins: parsed.data.WEB_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
    isProd: parsed.data.NODE_ENV === 'production',
  };
}
