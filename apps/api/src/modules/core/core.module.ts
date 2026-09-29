import { Global, Module } from '@nestjs/common';
import { CoreAccessService } from './core.access';

@Global()
@Module({
  providers: [CoreAccessService],
  exports: [CoreAccessService],
})
export class CoreModule {}
