import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

@Module({
  imports: [EducationModule, AuditModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
