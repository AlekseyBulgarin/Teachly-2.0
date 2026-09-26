import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

const transactionContext = new AsyncLocalStorage<DatabaseTransaction>();

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly pool: Pool;
  private readonly rootDb: Database;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    this.pool = new Pool({ connectionString: url });
    this.rootDb = drizzle(this.pool, { schema });
  }

  get db(): Database {
    return (transactionContext.getStore() as Database | undefined) ?? this.rootDb;
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return this.rootDb.transaction((tx) => transactionContext.run(tx, work));
  }

  async ping(): Promise<void> {
    await this.pool.query('select 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
