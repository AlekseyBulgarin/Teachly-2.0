import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD, NestApplication } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { SkipThrottle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureHttpApp } from '../src/common/configure-http-app';

@Controller()
class SecurityTestController {
  @Get('limited')
  limited() {
    return { ok: true };
  }

  @Get('health-like')
  @SkipThrottle()
  healthLike() {
    return { ok: true };
  }
}

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 2 }])],
  controllers: [SecurityTestController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
class SecurityTestModule {}

describe('HTTP security baseline', () => {
  let app: NestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [SecurityTestModule] }).compile();
    app = moduleRef.createNestApplication<NestApplication>();
    configureHttpApp(app);
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => app.close());

  it('sets security headers and rejects traffic above the configured limit', async () => {
    const first = await request(app.getHttpServer()).get('/limited').expect(200);
    expect(first.headers['content-security-policy']).toContain("default-src 'self'");
    expect(first.headers['x-content-type-options']).toBe('nosniff');
    expect(first.headers['x-ratelimit-limit']).toBe('2');

    await request(app.getHttpServer()).get('/limited').expect(200);
    const limited = await request(app.getHttpServer()).get('/limited').expect(429);
    expect(limited.body).toMatchObject({ statusCode: 429, code: 'TOO_MANY_REQUESTS' });
    expect(limited.body.requestId).toEqual(expect.any(String));
  });

  it('allows health endpoints to opt out of throttling', async () => {
    for (let index = 0; index < 4; index += 1) {
      await request(app.getHttpServer()).get('/health-like').expect(200);
    }
  });
});
