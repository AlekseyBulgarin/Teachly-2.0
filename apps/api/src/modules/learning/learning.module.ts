import { Module } from '@nestjs/common';
import { TeachingModule } from '../teaching/teaching.module';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';

@Module({
  imports: [TeachingModule],
  controllers: [LearningController],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
