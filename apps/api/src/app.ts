import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { createSafetyPipeline, type LlmClient } from '@childgpt/safety';
import type { Config } from './config';
import { originGuard } from './auth/middleware';
import { errorHandler, notFound } from './http/errors';
import { logger } from './logger';
import { authRouter } from './routes/auth';
import { kidRouter } from './routes/kid';
import { parentRouter } from './routes/parent';
import { createChatService } from './services/chat';
import { createNotifier, type Notifier } from './services/notify';

export interface AppDeps {
  config: Config;
  llm: LlmClient;
  notifier?: Notifier;
}

export function createApp({ config, llm, notifier = createNotifier(config, logger) }: AppDeps) {
  const app = express();
  const pipeline = createSafetyPipeline(llm, { inputJudge: config.SAFETY_INPUT_JUDGE });
  const chat = createChatService({ config, pipeline, notifier, logger });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.webOrigins, credentials: true }));
  app.use(express.json({ limit: '16kb' }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      serializers: { req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }) },
    }),
  );
  app.use(originGuard(config));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, llm: config.LLM_PROVIDER, inputJudge: config.SAFETY_INPUT_JUDGE });
  });
  app.use('/api/auth', authRouter(config));
  app.use('/api/parent', parentRouter(config));
  app.use('/api/kid', kidRouter(config, chat));

  app.use('/api', () => {
    throw notFound('Такого адреса нет');
  });
  app.use(errorHandler);
  return app;
}
