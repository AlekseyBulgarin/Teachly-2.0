import { Injectable, UnauthorizedException } from '@nestjs/common';
import { developmentAuthEnabled } from '../../common/config';
import type { AuthenticationAdapter } from './auth.port';
import type { ExternalPrincipal } from './auth.types';

@Injectable()
export class DevelopmentAuthenticationAdapter implements AuthenticationAdapter {
  async resolve(request: { headers: Record<string, unknown> }): Promise<ExternalPrincipal | null> {
    if (!developmentAuthEnabled()) {
      throw new UnauthorizedException('Development authentication is disabled');
    }
    const value = request.headers['x-dev-user'];
    const subject = Array.isArray(value) ? value[0] : value;
    if (typeof subject !== 'string' || !subject) return null;
    if (subject !== 'teacher' && subject !== 'student' && !subject.startsWith('student:') && !subject.startsWith('teacher:')) return null;
    return {
      provider: 'development',
      subject: subject === 'teacher'
        ? (process.env.DEV_TEACHER_EXTERNAL_SUBJECT ?? 'dev-teacher')
        : subject === 'student'
          ? (process.env.DEV_STUDENT_EXTERNAL_SUBJECT ?? 'dev-student')
          : subject.startsWith('student:') ? `dev-student-${subject.slice('student:'.length)}` : `dev-teacher-${subject.slice('teacher:'.length)}`,
    };
  }
}
