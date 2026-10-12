import 'dotenv/config';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../src/infrastructure/database/database';
import { auditEvents, externalIdentities, users } from '../src/infrastructure/database/schema';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function main(): Promise<void> {
  const userId = process.env.TEACHLY_USER_ID?.trim();
  const subject = process.env.NEON_AUTH_SUBJECT?.trim();
  if (!userId || !uuid.test(userId)) throw new Error('TEACHLY_USER_ID must be an existing Teachly user UUID');
  if (!subject || subject.length > 255) throw new Error('NEON_AUTH_SUBJECT is required and must be at most 255 characters');
  if (process.env.DATABASE_URL_UNPOOLED) process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;

  const database = new DatabaseService();
  try {
    await database.transaction(async () => {
      const [user] = await database.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
      if (!user) throw new Error(`Teachly user ${userId} does not exist`);

      const [created] = await database.db.insert(externalIdentities)
        .values({ userId, provider: 'neon', subject })
        .onConflictDoNothing()
        .returning({ id: externalIdentities.id });
      const [mapping] = await database.db.select({ userId: externalIdentities.userId })
        .from(externalIdentities)
        .where(and(eq(externalIdentities.provider, 'neon'), eq(externalIdentities.subject, subject)))
        .limit(1);
      if (mapping?.userId !== userId) throw new Error('This Neon subject is already linked to a different Teachly user');
      if (created) {
        await database.db.insert(auditEvents).values({
          action: 'external_identity_linked',
          resourceType: 'user',
          resourceId: userId,
          metadata: { provider: 'neon', subject },
        });
      }
      console.log(created ? 'Neon identity linked.' : 'Neon identity mapping already exists.');
    });
  } finally {
    await database.onModuleDestroy();
  }
}

void main().catch(() => {
  // Keep environment-derived identifiers out of CI and production logs.
  console.error('Failed to link Neon identity. Review the supplied identifiers and database state.');
  process.exitCode = 1;
});
