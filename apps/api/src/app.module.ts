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
import { LearningModule } from './modules/learning/learning.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AiModule } from './modules/ai/ai.module';
import { CoreModule } from './modules/core/core.module';
import { TaskBankModule } from './modules/assessment/task-bank.module';

@Module({
  imports: [
    DatabaseModule,
    CoreModule,
    TaskBankModule,
    IdentityModule,
    UsersModule,
    EducationModule,
    TeachingModule,
    AttemptsModule,
    TenancyModule,
    IntegrationsModule,
    ExternalUsersModule,
    LearningModule,
    KnowledgeModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
