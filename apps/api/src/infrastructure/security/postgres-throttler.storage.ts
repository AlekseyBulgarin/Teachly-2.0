import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { DatabaseService } from '../database/database';

type CounterRow = {
  total_hits: number;
  expires_at: Date;
  blocked_until: Date | null;
};

@Injectable()
export class PostgresThrottlerStorage implements ThrottlerStorage {
  private callsSinceCleanup = 0;

  constructor(private readonly database: DatabaseService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const namespacedKey = `${throttlerName}:${key}`;
    const result = await this.database.pool.query<CounterRow>(`
      INSERT INTO rate_limit_counters (key, total_hits, expires_at, blocked_until, updated_at)
      VALUES ($1, 1, clock_timestamp() + ($2 * interval '1 millisecond'), NULL, clock_timestamp())
      ON CONFLICT (key) DO UPDATE SET
        total_hits = CASE
          WHEN rate_limit_counters.blocked_until > clock_timestamp() THEN rate_limit_counters.total_hits
          WHEN rate_limit_counters.expires_at <= clock_timestamp() THEN 1
          ELSE rate_limit_counters.total_hits + 1
        END,
        expires_at = CASE
          WHEN rate_limit_counters.blocked_until > clock_timestamp() THEN rate_limit_counters.expires_at
          WHEN rate_limit_counters.expires_at <= clock_timestamp() THEN clock_timestamp() + ($2 * interval '1 millisecond')
          ELSE rate_limit_counters.expires_at
        END,
        blocked_until = CASE
          WHEN rate_limit_counters.blocked_until > clock_timestamp() THEN rate_limit_counters.blocked_until
          WHEN rate_limit_counters.expires_at <= clock_timestamp() THEN NULL
          WHEN rate_limit_counters.total_hits + 1 > $3 THEN clock_timestamp() + ($4 * interval '1 millisecond')
          ELSE NULL
        END,
        updated_at = clock_timestamp()
      RETURNING total_hits, expires_at, blocked_until
    `, [namespacedKey, ttl, limit, blockDuration]);
    const row = result.rows[0];
    if (!row) throw new Error('Rate limit counter update returned no row');

    this.callsSinceCleanup += 1;
    if (this.callsSinceCleanup >= 1_000) {
      this.callsSinceCleanup = 0;
      void this.cleanupExpired();
    }

    const now = Date.now();
    const secondsUntil = (date: Date) => Math.max(0, Math.ceil((date.getTime() - now) / 1_000));
    return {
      totalHits: row.total_hits,
      timeToExpire: secondsUntil(row.expires_at),
      isBlocked: Boolean(row.blocked_until && row.blocked_until.getTime() > now),
      timeToBlockExpire: row.blocked_until ? secondsUntil(row.blocked_until) : 0,
    };
  }

  private async cleanupExpired(): Promise<void> {
    try {
      await this.database.pool.query(`
        DELETE FROM rate_limit_counters
        WHERE expires_at < clock_timestamp() - interval '1 day'
          AND (blocked_until IS NULL OR blocked_until < clock_timestamp())
      `);
    } catch {
      // Cleanup is best-effort; request limiting remains fail-closed on the primary query.
    }
  }
}
