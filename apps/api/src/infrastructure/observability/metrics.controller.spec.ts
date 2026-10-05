import { UnauthorizedException } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  const previousToken = process.env.METRICS_TOKEN;
  const previousEnvironment = process.env.NODE_ENV;

  afterEach(() => {
    if (previousToken === undefined) delete process.env.METRICS_TOKEN;
    else process.env.METRICS_TOKEN = previousToken;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  });

  it('requires the configured bearer token', async () => {
    process.env.NODE_ENV = 'production';
    process.env.METRICS_TOKEN = 'test-metrics-token-at-least-32-characters';
    const service = new MetricsService();
    const controller = new MetricsController(service);
    const response = { setHeader: jest.fn() } as never;

    await expect(controller.read(undefined, response)).rejects.toThrow(UnauthorizedException);
    await expect(controller.read('Bearer test-metrics-token-at-least-32-characters', response)).resolves.toContain('teachly_process_');
    service.onModuleDestroy();
  });
});
