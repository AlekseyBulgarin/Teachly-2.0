import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/api.dto';
import { PublishedTaskResponseDto } from './education.dto';
import { EducationService } from './education.service';

@ApiTags('tasks')
@ApiBadRequestResponse({ type: ApiErrorDto })
@Controller('tasks')
export class EducationController {
  constructor(private readonly education: EducationService) {}

  @Get('published')
  @ApiOkResponse({ type: [PublishedTaskResponseDto] })
  async listPublished(): Promise<PublishedTaskResponseDto[]> {
    const rows = await this.education.listPublishedTaskVersions();
    return rows.map((row) => PublishedTaskResponseDto.from(row, this.education.toPublicTaskVersion(row.taskVersion)));
  }

  @Get('published/:taskVersionId')
  @ApiOkResponse({ type: PublishedTaskResponseDto })
  @ApiParam({ name: 'taskVersionId', format: 'uuid' })
  async getPublished(@Param('taskVersionId', ParseUUIDPipe) taskVersionId: string): Promise<PublishedTaskResponseDto> {
    const row = await this.education.getPublishedTaskVersion(taskVersionId);
    return PublishedTaskResponseDto.from(row, this.education.toPublicTaskVersion(row.taskVersion));
  }
}
