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
import { DisabledAiProvider } from './disabled-ai-provider';
import { OpenAiProvider } from './openai-provider';
import { resolveAiProviderConfiguration } from './ai-provider.config';
import { PartnerRemediationController } from './partner-remediation.controller';
import { PartnerRemediationService } from './partner-remediation.service';
import { AiTraceController } from './ai-trace.controller';
import { AiStatusController } from './ai-status.controller';

@Module({
  imports: [AttemptsModule, AuditModule, EducationModule, ExternalUsersModule, IntegrationsModule, KnowledgeModule, LearningModule],
  controllers: [PartnerRemediationController, AiTraceController, AiStatusController],
  providers: [DisabledAiProvider, FakeAiProvider, OpenAiProvider, AiContextAssembler, AiRuntime, PartnerRemediationService, {
    provide: AI_PROVIDER,
    useFactory: (disabled: DisabledAiProvider, fake: FakeAiProvider, openai: OpenAiProvider) => {
      const mode = resolveAiProviderConfiguration().mode;
      if (mode === 'fake') return fake;
      if (mode === 'openai' || mode === 'openai-compatible') return openai;
      return disabled;
    },
    inject: [DisabledAiProvider, FakeAiProvider, OpenAiProvider],
  }],
  exports: [AiRuntime, AiContextAssembler],
})
export class AiModule {}
