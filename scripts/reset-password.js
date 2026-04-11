#!/usr/bin/env node
require('dotenv').config();
const argv = require('minimist')(process.argv.slice(2));
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function usage() {
  console.log('Usage: node scripts/reset-password.js --model <Admin|Tech|Shop|Customer> (--id <id> | --username <username> | --email <email>) --password <newPassword>');
  process.exit(2);
}

async function main() {
  const model = (argv.model || argv.m || '').toString();
  const id = argv.id;
  const username = argv.username;
  const email = argv.email;
  const password = argv.password || argv.p;

  if (!model || !password || (!id && !username && !email)) return usage();

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

  const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
  const modelClient = prisma[modelKey];
  if (!modelClient) {
    console.error('Unknown model:', model);
    process.exit(2);
  }

  try {
    await prisma.$connect();

    let where = null;
    if (id) where = { id: String(id) };
    else if (username) where = { username: String(username) };
    else if (email) where = { email: String(email) };

    const existing = await modelClient.findUnique({ where });
    if (!existing) {
      console.error('No record found for', where);
      process.exit(1);
    }

    const hash = await bcrypt.hash(String(password), rounds);
    await modelClient.update({ where, data: { password: hash } });
    console.log(`Password for ${model} ${JSON.stringify(where)} reset and hashed.`);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting password:', err.message || err);
    process.exit(3);
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

if (require.main === module) main();
