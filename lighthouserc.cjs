module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/test-server.mjs --port=4174 --quality-stubs',
      startServerReadyPattern: 'Auto Resume test server listening',
      url: ['http://127.0.0.1:4174/'],
      numberOfRuns: 1,
      chromePath: process.env.CHROME_PATH || undefined,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'errors-in-console': 'error',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'artifacts/lighthouse',
    },
  },
};
