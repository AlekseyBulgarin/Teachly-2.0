import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';

describe('MonitoringController', () => {
  const previousToken = process.env.METRICS_TOKEN;
  const previousEnvironment = process.env.NODE_ENV;

  afterEach(() => {
    if (previousToken === undefined) delete process.env.METRICS_TOKEN;
    else process.env.METRICS_TOKEN = previousToken;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
  });

  it('requires the internal metrics token and accepts only bounded ranges', async () => {
    process.env.NODE_ENV = 'production';
    process.env.METRICS_TOKEN = 'test-metrics-token-at-least-32-characters';
    const overview = jest.fn().mockResolvedValue({ source: 'not_configured', panels: [] });
    const controller = new MonitoringController({ overview } as never);
    expect(() => controller.overview(undefined, '1h')).toThrow(UnauthorizedException);
    expect(() => controller.overview('Bearer test-metrics-token-at-least-32-characters', '30d')).toThrow(BadRequestException);
    await expect(controller.overview('Bearer test-metrics-token-at-least-32-characters', '6h')).resolves.toMatchObject({ source: 'not_configured' });
    expect(overview).toHaveBeenCalledWith('6h');
  });
});
