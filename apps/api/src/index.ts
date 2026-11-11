import mongoose from 'mongoose';
import { createApp } from './app';
import { loadConfig } from './config';
import { createLlmClient } from './llm';
import { logger } from './logger';

async function main() {
  const config = loadConfig();
  await mongoose.connect(config.MONGODB_URI);
  logger.info({ llm: config.LLM_PROVIDER, inputJudge: config.SAFETY_INPUT_JUDGE }, 'mongo connected');

  const app = createApp({ config, llm: createLlmClient(config, logger) });
  const server = app.listen(config.PORT, () => logger.info({ port: config.PORT }, 'ChildGPT API started'));

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
      void mongoose.disconnect().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
