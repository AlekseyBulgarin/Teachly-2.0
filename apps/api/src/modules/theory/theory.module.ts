import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { IdentityModule } from '../identity/identity.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { TheoryController } from './theory.controller';
import { TheoryGuard } from './theory.guard';
import { TheoryService } from './theory.service';

@Module({
  imports: [AuditModule, IdentityModule, IntegrationsModule, TenancyModule],
  controllers: [TheoryController],
  providers: [TheoryGuard, TheoryService],
  exports: [TheoryService],
})
export class TheoryModule {}

