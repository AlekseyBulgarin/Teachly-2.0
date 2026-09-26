import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentPrincipal } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { UsersService } from './users.service';
import { UserResponseDto } from './users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  async currentUser(@CurrentPrincipal() principal: AuthenticatedPrincipal): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.users.getById(principal.userId));
  }
}
