import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { TeachingController } from './teaching.controller';
import { TeachingService } from './teaching.service';

@Module({
  imports: [EducationModule, AuditModule],
  controllers: [TeachingController],
  providers: [TeachingService],
  exports: [TeachingService],
})
export class TeachingModule {}
