import { Controller, Get, Param } from '@nestjs/common';
import { EducationService } from './education.service';

@Controller('tasks')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Get('published')
  async listPublished() {
    const rows = await this.education.listPublishedTaskVersions();
    return rows.map((row) => ({ ...row, taskVersion: this.education.toPublicTaskVersion(row.taskVersion) }));
  }

  @Get('published/:taskVersionId')
  async getPublished(@Param('taskVersionId') taskVersionId: string) {
    const row = await this.education.getPublishedTaskVersion(taskVersionId);
    return { taskVersion: this.education.toPublicTaskVersion(row.taskVersion), task: row.task, subject: row.subject, course: row.course, topic: row.topic, skill: row.skill };
  }
}
