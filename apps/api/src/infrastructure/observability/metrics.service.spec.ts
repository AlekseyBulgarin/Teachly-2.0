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

  it('exports bounded AI labels and provider-reported usage without identifiers', async () => {
    const service = new MetricsService();
    service.observeAiRequest({
      status: 'succeeded', provider: 'Example Gateway', model: 'model/customer-specific/value',
      durationSeconds: 0.5, usage: { inputTokens: 12, outputTokens: 4, estimatedCostMicros: 20 }, abstained: true,
    });
    const output = await service.exposition();
    expect(output).toContain('teachly_ai_requests_total');
    expect(output).toContain('provider="example-gateway"');
    expect(output).toContain('model_family="model-customer-specific-value"');
    expect(output).toContain('teachly_ai_tokens_total');
    expect(output).toContain('teachly_ai_abstentions_total');
    service.onModuleDestroy();
  });
});
