import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PublishedTaskContext, PublicTaskVersion, TaskOption } from './education.types';

export class TaskOptionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  static from(option: TaskOption): TaskOptionDto {
    return { id: option.id, label: option.label };
  }
}

export class TaskContentDto {
  @ApiProperty()
  statement!: string;

  @ApiProperty({ type: [TaskOptionDto], required: false })
  options?: TaskOptionDto[];

  @ApiPropertyOptional({ type: Object, additionalProperties: true })
  metadata?: Record<string, unknown>;
}

export class PublicTaskVersionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  taskId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ example: 'single-choice' })
  taskType!: string;

  @ApiProperty({ enum: ['published'] })
  status!: 'published';

  @ApiProperty({ type: TaskContentDto })
  content!: TaskContentDto;

  @ApiProperty({ example: 'single-choice.v1' })
  evaluationRule!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  publishedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  static from(taskVersion: PublicTaskVersion): PublicTaskVersionDto {
    return {
      ...taskVersion,
      content: {
        statement: taskVersion.content.statement,
        ...(taskVersion.content.options ? { options: taskVersion.content.options.map(TaskOptionDto.from) } : {}),
        ...(taskVersion.content.title ? { title: taskVersion.content.title } : {}),
        ...(taskVersion.content.blocks ? { blocks: taskVersion.content.blocks } : {}),
        ...(taskVersion.content.attachments ? { attachments: taskVersion.content.attachments } : {}),
        ...(taskVersion.content.metadata ? { metadata: taskVersion.content.metadata } : {}),
      },
    };
  }
}

export class TaskReferenceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  subjectId!: string | null;

  @ApiProperty({ format: 'uuid' })
  courseId!: string | null;

  @ApiProperty({ format: 'uuid' })
  topicId!: string | null;

  @ApiProperty({ format: 'uuid' })
  skillId!: string | null;
}

export class SubjectDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class CourseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiProperty()
  name!: string;
}

export class TopicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  courseId!: string;

  @ApiProperty()
  name!: string;
}

export class SkillDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  topicId!: string;

  @ApiProperty()
  name!: string;
}

export class PublishedTaskResponseDto {
  @ApiProperty({ type: PublicTaskVersionDto })
  taskVersion!: PublicTaskVersionDto;

  @ApiProperty({ type: TaskReferenceDto })
  task!: TaskReferenceDto;

  @ApiProperty({ type: SubjectDto, nullable: true })
  subject!: SubjectDto | null;

  @ApiProperty({ type: CourseDto, nullable: true })
  course!: CourseDto | null;

  @ApiProperty({ type: TopicDto, nullable: true })
  topic!: TopicDto | null;

  @ApiProperty({ type: SkillDto, nullable: true })
  skill!: SkillDto | null;

  static from(context: PublishedTaskContext, taskVersion: PublicTaskVersion): PublishedTaskResponseDto {
    return {
      taskVersion: PublicTaskVersionDto.from(taskVersion),
      task: context.task,
      subject: context.subject,
      course: context.course,
      topic: context.topic,
      skill: context.skill,
    };
  }
}
