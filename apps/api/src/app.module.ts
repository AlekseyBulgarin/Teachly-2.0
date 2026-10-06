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
import { TheoryModule } from './modules/theory/theory.module';
import { TrainerModule } from './modules/trainer/trainer.module';
import { WhiteboardModule } from './modules/whiteboard/whiteboard.module';
import { LearnerIntelligenceModule } from './modules/learner-intelligence/learner-intelligence.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { ObservabilityModule } from './infrastructure/observability/observability.module';

@Module({
  imports: [
    DatabaseModule,
    ObservabilityModule,
    SecurityModule,
    CoreModule,
    TaskBankModule,
    TheoryModule,
    TrainerModule,
    WhiteboardModule,
    LearnerIntelligenceModule,
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
