import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UsersModule } from '../users/users.module';
import { ExternalUsersController } from './external-users.controller';
import { ExternalUsersService } from './external-users.service';

@Module({
  imports: [IntegrationsModule, UsersModule],
  controllers: [ExternalUsersController],
  providers: [ExternalUsersService],
  exports: [ExternalUsersService],
})
export class ExternalUsersModule {}
