import { Module } from '@nestjs/common';
import { TeachingModule } from '../teaching/teaching.module';
import { LearningService } from './learning.service';

@Module({
  imports: [TeachingModule],
  providers: [LearningService],
  exports: [LearningService],
})
export class LearningModule {}
