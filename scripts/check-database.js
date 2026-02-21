// Pre-build check to ensure DATABASE_URL is set.
// The build is allowed to proceed without DATABASE_URL because Vercel (and
// other hosts) inject the connection string at *runtime*, not at build time.
// To turn this into a hard failure (e.g. in a custom CI pipeline), set
// REQUIRE_DATABASE=1 in the environment.
const hasDb = Boolean(process.env.DATABASE_URL);
const requireDbExplicit = process.env.REQUIRE_DATABASE === '1';

if (!hasDb) {
  if (requireDbExplicit) {
    console.error('\nERROR: DATABASE_URL is not set.\n\nThis project requires a Neon (Postgres) DATABASE_URL.\nSet DATABASE_URL in your .env.local for local development or in your hosting provider (Vercel) for deploys.\n');
    process.exit(1);
  }

  console.warn('\nWARNING: DATABASE_URL is not set. Continuing build without a database connection.\nMake sure DATABASE_URL is set in your hosting provider (Vercel) environment variables before deploying.\n');
} else {
  console.log('DATABASE_URL found — continuing.');
}
