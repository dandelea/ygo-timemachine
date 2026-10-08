import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DB_DIALECT: 'sqlite',
      SQLITE_STORAGE: ':memory:',
      LOG_LEVEL: 'silent',
    },
  },
})
