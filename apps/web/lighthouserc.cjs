module.exports = {
  ci: {
    collect: {
      startServerCommand: 'corepack pnpm exec next start -p 3102',
      startServerReadyPattern: 'Ready|ready|started server',
      startServerReadyTimeout: 120000,
      url: [
        'http://127.0.0.1:3102/ecosystem',
        'http://127.0.0.1:3102/teacher',
        'http://127.0.0.1:3102/integrations',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 350 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
};
