import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../infrastructure/database/database';
import { users } from '../../infrastructure/database/schema';
import type { UserView } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findById(userId: string): Promise<UserView | null> {
    const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user ? { id: user.id, type: user.type, displayName: user.displayName, createdAt: user.createdAt } : null;
  }

  async getById(userId: string): Promise<UserView> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createStudent(displayName: string): Promise<UserView> {
    const [student] = await this.database.db.insert(users).values({ type: 'student', displayName }).returning();
    if (!student) throw new Error('Student creation failed');
    return { id: student.id, type: student.type, displayName: student.displayName, createdAt: student.createdAt };
  }
}
