import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { users } from '../../infrastructure/database/schema';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async getById(userId: string) {
    const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
