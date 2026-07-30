module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting
        'refactor', // Code restructuring
        'perf', // Performance
        'test', // Tests
        'build', // Build system
        'ci', // CI/CD
        'chore', // Maintenance
        'revert', // Revert
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'web',
        'ai',
        'auth',
        'portfolio',
        'stocks',
        'goals',
        'chat',
        'news',
        'scores',
        'prisma',
        'docker',
        'nginx',
        'ci',
        'deps',
        'sprint',
        'header',
        'auth-ui',
        'dev',
        'checklists',
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
