import { MonitoringQueryService } from './monitoring-query.service';

describe('MonitoringQueryService', () => {
  const originalUrl = process.env.PROMETHEUS_URL;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.PROMETHEUS_URL;
    else process.env.PROMETHEUS_URL = originalUrl;
    global.fetch = originalFetch;
  });

  it('returns an explicit not-configured state without making network calls', async () => {
    delete process.env.PROMETHEUS_URL;
    const fetchMock = jest.fn();
    global.fetch = fetchMock as never;
    const result = await new MonitoringQueryService().overview('1h');
    expect(result.source).toBe('not_configured');
    expect(result.panels.every((panel) => panel.status === 'not_configured')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('executes only reviewed range queries and strips unapproved labels', async () => {
    process.env.PROMETHEUS_URL = 'http://prometheus.internal:9090';
    global.fetch = jest.fn(async (input: URL | string) => {
      const url = new URL(String(input));
      expect(url.pathname).toBe('/api/v1/query_range');
      expect(url.searchParams.get('start')).toBeTruthy();
      expect(url.searchParams.get('end')).toBeTruthy();
      expect(url.searchParams.get('step')).toBe('30');
      return new Response(JSON.stringify({
        status: 'success',
        data: { resultType: 'matrix', result: [{ metric: { direction: 'input', learner_id: 'must-not-leak' }, values: [[1_791_396_000, '0.5']] }] },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as never;
    const result = await new MonitoringQueryService().overview('1h');
    expect(result.source).toBe('prometheus');
    expect(result.panels).toHaveLength(16);
    expect(result.panels[0]?.series[0]?.labels).toEqual({ direction: 'input' });
    expect(global.fetch).toHaveBeenCalledTimes(16);
  });
});
