import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('exports bounded HTTP labels in Prometheus format', async () => {
    const service = new MetricsService();
    const stop = service.startRequest('GET');
    stop();
    service.observeRequest({ method: 'GET', route: '/v1/users/:id', statusCode: '200' }, 0.025);

    const output = await service.exposition();
    expect(output).toContain('teachly_http_requests_total');
    expect(output).toContain('route="/v1/users/:id"');
    expect(output).toContain('status_code="200"');
    expect(output).not.toContain('authorization');
    service.onModuleDestroy();
  });
});
