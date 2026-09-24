import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './health.controller';
import { IdentityModule } from './modules/identity/identity.module';
import { UsersModule } from './modules/users/users.module';
import { EducationModule } from './modules/education/education.module';
import { TeachingModule } from './modules/teaching/teaching.module';
import { AttemptsModule } from './modules/attempts/attempts.module';

@Module({
  imports: [DatabaseModule, IdentityModule, UsersModule, EducationModule, TeachingModule, AttemptsModule],
  controllers: [HealthController],
})
export class AppModule {}
