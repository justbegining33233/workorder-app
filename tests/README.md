# Testing Guide

## Running Tests
- Unit: `npm run test:unit`
- Integration: `npm run test:integration`
- E2E: `npm run test:e2e`

## Test Database Setup
- Create a separate test database in PostgreSQL
- Set `DATABASE_URL` in `.env.test` to point to the test database
- Use `npx prisma migrate deploy --env-file .env.test` to set up schema
- Run tests with `NODE_ENV=test`

## Adding More Tests
- Place unit tests in `tests/unit.test.ts`
- Place integration tests in `tests/integration.test.ts`
- Place E2E tests in `tests/e2e.test.ts` and feature-specific files
