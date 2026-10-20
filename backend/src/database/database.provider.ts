import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema, type Schema } from '@fluy/schema';
import type { Env } from '@/config/env.schema';

export const DATABASE = Symbol('DATABASE');
export const DATABASE_POOL = Symbol('DATABASE_POOL');

export type Database = NodePgDatabase<Schema>;

export const databasePoolProvider: Provider = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Pool =>
    new Pool({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    }),
};

export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [DATABASE_POOL],
  useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
};
