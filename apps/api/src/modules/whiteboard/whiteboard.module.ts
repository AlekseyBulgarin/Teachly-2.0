import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { WhiteboardController } from './whiteboard.controller';
import { WhiteboardService } from './whiteboard.service';

@Module({
  imports: [AuditModule, EducationModule, IntegrationsModule],
  controllers: [WhiteboardController],
  providers: [WhiteboardService],
})
export class WhiteboardModule {}
