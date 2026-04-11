require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    async function rawList(table, identCols = ['username','email'], extraCols = []) {
      // Try to select an identifying column from identCols; fall back if column missing
      for (const col of identCols) {
        try {
          const cols = ['id','password', col, ...extraCols].map(c => `\"${c}\"`).join(', ');
          const rows = await prisma.$queryRawUnsafe(`SELECT ${cols} FROM \"${table}\" ORDER BY id DESC LIMIT 200`);
          return rows.map(r => ({ id: r.id, password: r.password, ident: r[col] || '' , extra: extraCols.reduce((acc, k) => (acc[k]=r[k], acc), {}) }));
        } catch (e) {
          // try next ident column
        }
      }
      // final fallback: only id/password
      try {
        const rows = await prisma.$queryRawUnsafe(`SELECT \"id\", \"password\" FROM \"${table}\" ORDER BY id DESC LIMIT 200`);
        return rows.map(r => ({ id: r.id, password: r.password, ident: '' }));
      } catch (e) {
        return [];
      }
    }

    function analyze(list, role) {
      console.log(`\n--- ${role} (${list.length}) ---`);
      let countHash = 0, countEmpty = 0, countPlain = 0;
      list.forEach(u => {
        const pw = u.password || '';
        let kind = 'unknown';
        if (!pw) { kind = 'empty'; countEmpty++; }
        else if (pw.startsWith('$2') || pw.startsWith('$argon')) { kind = 'hashed'; countHash++; }
        else { kind = 'plaintext-or-other'; countPlain++; }
        console.log(`${role} ${u.ident || u.id} | id=${u.id} | pw=${kind}`);
      });
      console.log(`${role} summary: hashed=${countHash} empty=${countEmpty} plain=${countPlain}`);
    }

    const admins = await rawList('admins', ['username','email']);
    const shops = await rawList('shops', ['username','email'], ['status']);
    const customers = await rawList('customers', ['username','email']);
    const techs = await rawList('techs', ['email','firstName']);

    analyze(admins, 'Admin');
    analyze(shops, 'Shop');
    analyze(customers, 'Customer');
    analyze(techs, 'Tech');
  } catch (err) {
    console.error('Error checking login readiness:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
