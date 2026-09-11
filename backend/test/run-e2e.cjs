const { spawnSync } = require('node:child_process');
require('dotenv/config');

if (!process.env.TEST_DATABASE_URL) {
  console.error(
    'Auth E2E tests require TEST_DATABASE_URL. Point it at a disposable PostgreSQL database; the runner applies migrations automatically.',
  );
  process.exit(1);
}

const testEnv = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  DIRECT_URL: process.env.TEST_DATABASE_URL,
};

const prismaBin = require.resolve('prisma/build/index.js');
const migration = spawnSync(
  process.execPath,
  [prismaBin, 'migrate', 'deploy'],
  { stdio: 'inherit', env: testEnv },
);
if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(
  process.execPath,
  [jestBin, '--config', './test/jest-e2e.json', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...testEnv,
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        '--experimental-vm-modules',
      ]
        .filter(Boolean)
        .join(' '),
    },
  },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
