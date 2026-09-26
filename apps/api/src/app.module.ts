import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './health.controller';
import { IdentityModule } from './modules/identity/identity.module';
import { UsersModule } from './modules/users/users.module';
import { EducationModule } from './modules/education/education.module';
import { TeachingModule } from './modules/teaching/teaching.module';
import { AttemptsModule } from './modules/attempts/attempts.module';
import { ExternalUsersModule } from './modules/external-users/external-users.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';

@Module({
  imports: [
    DatabaseModule,
    IdentityModule,
    UsersModule,
    EducationModule,
    TeachingModule,
    AttemptsModule,
    TenancyModule,
    IntegrationsModule,
    ExternalUsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
