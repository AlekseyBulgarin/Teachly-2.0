import { Module } from '@nestjs/common';
import { AttemptsModule } from '../attempts/attempts.module';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { ExternalUsersModule } from '../external-users/external-users.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { LearningModule } from '../learning/learning.module';
import { AI_PROVIDER } from './ai-provider';
import { AiContextAssembler } from './ai-context-assembler';
import { AiRuntime } from './ai-runtime.service';
import { FakeAiProvider } from './fake-ai-provider';
import { OpenAiProvider } from './openai-provider';
import { PartnerRemediationController } from './partner-remediation.controller';
import { PartnerRemediationService } from './partner-remediation.service';

@Module({
  imports: [AttemptsModule, AuditModule, EducationModule, ExternalUsersModule, IntegrationsModule, KnowledgeModule, LearningModule],
  controllers: [PartnerRemediationController],
  providers: [FakeAiProvider, OpenAiProvider, AiContextAssembler, AiRuntime, PartnerRemediationService, { provide: AI_PROVIDER, useExisting: OpenAiProvider }],
  exports: [AiRuntime, AiContextAssembler],
})
export class AiModule {}
