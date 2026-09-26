import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EducationModule } from '../education/education.module';
import { IdentityModule } from '../identity/identity.module';
import { UsersModule } from '../users/users.module';
import { TeachingController } from './teaching.controller';
import { TeachingService } from './teaching.service';

@Module({
  imports: [EducationModule, AuditModule, IdentityModule, UsersModule],
  controllers: [TeachingController],
  providers: [TeachingService],
  exports: [TeachingService],
})
export class TeachingModule {}
