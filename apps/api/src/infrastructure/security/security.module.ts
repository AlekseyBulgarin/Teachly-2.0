import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { PostgresThrottlerStorage } from './postgres-throttler.storage';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60_000,
      limit: 300,
    }]),
  ],
  providers: [
    PostgresThrottlerStorage,
    { provide: ThrottlerStorage, useExisting: PostgresThrottlerStorage },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class SecurityModule {}
