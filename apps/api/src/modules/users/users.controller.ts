import { Controller, Get } from '@nestjs/common';
import { CurrentPrincipal } from '../../common/request-context';
import type { AuthenticatedPrincipal } from '../identity/auth.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async currentUser(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.users.getById(principal.userId);
  }
}
