import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AttemptsModule } from '../attempts/attempts.module';
import { EducationModule } from '../education/education.module';
import { ExternalUsersModule } from '../external-users/external-users.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { LearningModule } from '../learning/learning.module';
import { TheoryModule } from '../theory/theory.module';
import { TrainerController } from './trainer.controller';
import { TrainerService } from './trainer.service';

@Module({
  imports: [AuditModule, AttemptsModule, EducationModule, ExternalUsersModule, IntegrationsModule, LearningModule, TheoryModule],
  controllers: [TrainerController],
  providers: [TrainerService],
})
export class TrainerModule {}

