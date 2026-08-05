module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'jira-ticket': ({ header }) => {
          const match = /(?:^|[\s(/])[A-Z]{2,10}-\d+/.test(header || '');
          return [match, 'commit message must reference a Jira ticket key (e.g. QUAN-123)'];
        },
      },
    },
  ],
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
    'jira-ticket': [2, 'always'],
  },
};
