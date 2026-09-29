import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { CoreModule } from '../core/core.module';
import { IdentityModule } from '../identity/identity.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ExternalUsersModule } from '../external-users/external-users.module';
import { LearningModule } from '../learning/learning.module';
import { TaskBankController } from './task-bank.controller';
import { TaskBankGuard } from './task-bank.guard';
import { GenericJsonTaskSourceAdapter } from './task-bank.adapter';
import { TaskBankService } from './task-bank.service';
import { VariantController } from './variant.controller';
import { VariantService } from './variant.service';

@Module({
  imports: [AuditModule, CoreModule, IdentityModule, IntegrationsModule, TenancyModule, ExternalUsersModule, LearningModule],
  controllers: [TaskBankController, VariantController],
  providers: [GenericJsonTaskSourceAdapter, TaskBankGuard, TaskBankService, VariantService],
})
export class TaskBankModule {}
