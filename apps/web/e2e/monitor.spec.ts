import { expect, test } from '@playwright/test';

test('Teachly Monitor rejects unauthenticated requests', async ({ request }) => {
  const response = await request.get('/monitor', { failOnStatusCode: false });
  expect(response.status()).toBe(401);
  expect(response.headers()['www-authenticate']).toContain('Teachly Monitor');
});

test('Teachly Monitor renders behind HTTP Basic authentication', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    httpCredentials: { username: 'playwright-operator', password: 'playwright-monitor-password' },
  });
  const page = await context.newPage();
  await page.route('**/api/monitor/overview?range=*', async (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      source: 'prometheus', range: '1h', generatedAt: '2026-10-07T12:00:00.000Z', stale: false,
      panels: [
        {
          id: 'availability', title: 'API availability', description: 'Prometheus scrape availability for the Teachly API.',
          kind: 'stat', unit: 'ratio', status: 'ok', alert: 'healthy', message: null,
          series: [{ labels: {}, points: [{ timestamp: 1_791_396_000, value: 1 }, { timestamp: 1_791_396_030, value: 1 }] }],
        },
        {
          id: 'ai-rate', title: 'AI request rate', description: 'AI runtime requests per second, including safe failures.',
          kind: 'timeseries', unit: 'requests_per_second', status: 'ok', alert: 'unknown', message: null,
          series: [{ labels: {}, points: [{ timestamp: 1_791_396_000, value: 0.2 }, { timestamp: 1_791_396_030, value: 0.4 }] }],
        },
      ],
    }),
  }));
  await page.goto(`${baseURL}/monitor`);
  await expect(page.getByRole('heading', { name: 'Teachly Monitor' })).toBeVisible();
  await expect(page.getByText('Учебная аналитика и персональные данные сюда не попадают.')).toBeVisible();
  await expect(page.getByText('API availability')).toBeVisible();
  await expect(page.getByText('100.0%')).toBeVisible();
  await expect(page.getByText('AI request rate')).toBeVisible();
  await context.close();
});
