import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { TeachingModule } from '../teaching/teaching.module';
import { AttemptsController, TeacherResultsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';

@Module({
  imports: [EducationModule, AuditModule, TeachingModule],
  controllers: [AttemptsController, TeacherResultsController],
  providers: [AttemptsService],
})
export class AttemptsModule {}
