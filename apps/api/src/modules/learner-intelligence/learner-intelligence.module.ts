import { Module } from '@nestjs/common';
import { AttemptsModule } from '../attempts/attempts.module';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { ExternalUsersModule } from '../external-users/external-users.module';
import { LearningModule } from '../learning/learning.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TrainerModule } from '../trainer/trainer.module';
import { LearnerIntelligenceController } from './learner-intelligence.controller';
import { LearnerIntelligenceService } from './learner-intelligence.service';

@Module({
  imports: [AttemptsModule, AuditModule, EducationModule, ExternalUsersModule, IntegrationsModule, LearningModule, TrainerModule],
  controllers: [LearnerIntelligenceController],
  providers: [LearnerIntelligenceService],
  exports: [LearnerIntelligenceService],
})
export class LearnerIntelligenceModule {}
