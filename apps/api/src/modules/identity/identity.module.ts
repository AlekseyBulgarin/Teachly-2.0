import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AUTHENTICATION_ADAPTER } from './auth.port';
import { DevelopmentAuthenticationAdapter } from './dev-auth.adapter';
import { IdentityService } from './identity.service';
import { NeonAuthenticationAdapter, NeonJwtVerifier } from './neon-auth.adapter';

@Module({
  providers: [
    IdentityService,
    DevelopmentAuthenticationAdapter,
    NeonJwtVerifier,
    NeonAuthenticationAdapter,
    {
      provide: AUTHENTICATION_ADAPTER,
      inject: [DevelopmentAuthenticationAdapter, NeonAuthenticationAdapter],
      useFactory: (development: DevelopmentAuthenticationAdapter, neon: NeonAuthenticationAdapter) =>
        (process.env.HUMAN_AUTH_PROVIDER?.trim() || (process.env.NODE_ENV === 'production' ? 'neon' : 'development')) === 'neon'
          ? neon
          : development,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [IdentityService],
})
export class IdentityModule {}
