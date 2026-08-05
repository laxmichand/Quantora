module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4200'],
      numberOfRuns: 1,
      startServerCommand:
        'npx http-server apps/web-angular/dist/quantora-frontend/browser -p 4200 --silent',
      startServerTimeout: 30000,
    },
    assert: {
      assertions: {
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.85 }],
        'categories:performance': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: 'seo-report',
    },
  },
};
