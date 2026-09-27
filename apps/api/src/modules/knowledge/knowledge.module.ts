import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { KNOWLEDGE_RETRIEVAL_PORT } from './knowledge.types';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';

@Module({
  imports: [AuditModule, IntegrationsModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, { provide: KNOWLEDGE_RETRIEVAL_PORT, useExisting: KnowledgeService }],
  exports: [KnowledgeService, KNOWLEDGE_RETRIEVAL_PORT],
})
export class KnowledgeModule {}
