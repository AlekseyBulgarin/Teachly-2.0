import { Module } from '@nestjs/common';
import { AttemptsModule } from '../attempts/attempts.module';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { LearningModule } from '../learning/learning.module';
import { AI_PROVIDER } from './ai-provider';
import { AiContextAssembler } from './ai-context-assembler';
import { AiRuntime } from './ai-runtime.service';
import { FakeAiProvider } from './fake-ai-provider';
import { OpenAiProvider } from './openai-provider';

@Module({
  imports: [AttemptsModule, AuditModule, EducationModule, IntegrationsModule, KnowledgeModule, LearningModule],
  providers: [FakeAiProvider, OpenAiProvider, AiContextAssembler, AiRuntime, { provide: AI_PROVIDER, useExisting: OpenAiProvider }],
  exports: [AiRuntime, AiContextAssembler],
})
export class AiModule {}
