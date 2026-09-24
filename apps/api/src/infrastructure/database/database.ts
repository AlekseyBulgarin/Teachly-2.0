import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool: Pool;
  readonly db: Database;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    this.pool = new Pool({ connectionString: url });
    this.db = drizzle(this.pool, { schema });
  }

  async ping(): Promise<void> {
    await this.pool.query('select 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
