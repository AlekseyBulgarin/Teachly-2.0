import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AUTHENTICATION_ADAPTER } from './auth.port';
import { DevelopmentAuthenticationAdapter } from './dev-auth.adapter';
import { IdentityService } from './identity.service';

@Module({
  providers: [
    IdentityService,
    DevelopmentAuthenticationAdapter,
    { provide: AUTHENTICATION_ADAPTER, useExisting: DevelopmentAuthenticationAdapter },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
