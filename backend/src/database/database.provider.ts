import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema, type Schema } from '@fluy/schema';
import type { Env } from '../config/env.schema';

export const DATABASE = Symbol('DATABASE');

export type Database = NodePgDatabase<Schema>;

export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Database => {
    const pool = new Pool({
      connectionString: config.get('DATABASE_URL', { infer: true }),
    });
    return drizzle(pool, { schema });
  },
};
