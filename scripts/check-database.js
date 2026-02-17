// Simple pre-build check to ensure DATABASE_URL is set (Neon only)
if (!process.env.DATABASE_URL) {
  console.error('\nERROR: DATABASE_URL is not set.\n\nThis project requires a Neon (Postgres) DATABASE_URL for all environments.\nSet DATABASE_URL in your .env.local for local development or in your hosting provider (Vercel) for deploys.\n');
  process.exit(1);
}
console.log('DATABASE_URL found — continuing.');
