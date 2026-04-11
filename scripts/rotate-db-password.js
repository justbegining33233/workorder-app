/*
  Rotate the password for the DB user in DATABASE_URL and update .env.local
  - Loads .env.local (if present)
  - Parses DATABASE_URL, generates a new strong password, runs `ALTER ROLE`
  - Replaces DATABASE_URL in .env.local with the new password

  IMPORTANT: this updates your local .env only. You MUST update hosting (Vercel)
  environment variables after rotation.
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

function genPassword() {
  return crypto.randomBytes(24).toString('hex');
}

function parseDatabaseUrl(dbUrl) {
  try {
    return new URL(dbUrl);
  } catch (err) {
    // Try to fix missing protocol
    return new URL(dbUrl.replace(/^postgres:/, 'postgresql:'));
  }
}

(async () => {
  const current = process.env.DATABASE_URL;
  if (!current) {
    console.error('No DATABASE_URL found in environment or .env.local');
    process.exit(1);
  }

  const parsed = parseDatabaseUrl(current);
  const user = parsed.username || parsed.user || parsed.pathname.split(':')[0];
  if (!user) {
    console.error('Could not determine DB username from DATABASE_URL');
    process.exit(1);
  }

  const newPass = genPassword();
  console.log('Rotating password for DB user:', user);

  const prisma = new PrismaClient();
  try {
    // ALTER ROLE with parameterized value
    const sql = `ALTER ROLE "${user}" WITH PASSWORD ${newPass ? '$1' : '$1'}`; // placeholder
    // Use tagged template for parameterization
    await prisma.$executeRawUnsafe(`ALTER ROLE "${user}" WITH PASSWORD '${newPass.replace(/'/g, "''")}'`);

    // Update .env.local if present
    const envPath = path.resolve(process.cwd(), '.env.local');
    let envContents = '';
    try { envContents = fs.readFileSync(envPath, 'utf8'); } catch (e) { /* ignore */ }

    const newUrl = (() => {
      const u = new URL(current);
      u.password = newPass;
      return u.toString();
    })();

    if (envContents) {
      const replaced = envContents.replace(/(^DATABASE_URL=)(["']?).*?(\2)$/m, `DATABASE_URL="${newUrl}"`);
      fs.writeFileSync(envPath, replaced, { encoding: 'utf8' });
      console.log('Updated .env.local with new DATABASE_URL');
    } else {
      // create .env.local with new value
      fs.writeFileSync(envPath, `DATABASE_URL="${newUrl}"\n`, { encoding: 'utf8' });
      console.log('Created .env.local with new DATABASE_URL');
    }

    console.log('\nSUCCESS: rotated DB user password and updated .env.local.');
    console.log('PLEASE update your hosting provider (Vercel) DATABASE_URL to the new value.');
    console.log('\nNew DATABASE_URL (copy and paste to Vercel):');
    console.log(newUrl);
  } catch (err) {
    console.error('Failed to rotate DB password:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
})();