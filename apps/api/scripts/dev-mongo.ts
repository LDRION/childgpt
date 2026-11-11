// Локальная MongoDB для разработки без Docker: `pnpm --filter @childgpt/api dev:mongo`.
// Данные сохраняются в apps/api/data/mongo (в .gitignore).
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = path.resolve(import.meta.dirname, '..', 'data', 'mongo');
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({ instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' } });
console.log(`MongoDB для разработки: ${server.getUri()}childgpt  (данные: ${dbPath})`);

const stop = async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
