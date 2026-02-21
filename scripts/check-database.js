// Pre-build check to ensure DATABASE_URL is set for production deploys.
// Allow non-production builds (CI linting, static analysis) to continue
// without a database connection. To enforce the check in CI/local runs,
// set REQUIRE_DATABASE=1 in the environment.
const hasDb = Boolean(process.env.DATABASE_URL);
const isProd = process.env.NODE_ENV === 'production';
const requireDbExplicit = process.env.REQUIRE_DATABASE === '1';

if (!hasDb) {
  if (isProd || requireDbExplicit) {
    console.error('\nERROR: DATABASE_URL is not set.\n\nThis project requires a Neon (Postgres) DATABASE_URL for production deploys.\nSet DATABASE_URL in your .env.local for local development or in your hosting provider (Vercel) for deploys.\n');
    process.exit(1);
  }

  console.warn('\nWARNING: DATABASE_URL is not set. Continuing build without a database connection.\nIf you are deploying to production, set DATABASE_URL in your hosting provider environment.\n');
} else {
  console.log('DATABASE_URL found — continuing.');
}
