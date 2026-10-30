// Provision the first administrator explicitly; public registration never grants admin.
require('dotenv').config({ quiet: true });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    throw new Error('Set ADMIN_EMAIL to a valid email address (maximum 100 characters).');
  }
  if (password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('Set ADMIN_PASSWORD to at least 12 characters and at most 72 UTF-8 bytes.');
  }
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'admin' || existing.status !== 'active') {
      throw new Error('An account already uses that email. No account or password was changed.');
    }
    console.log('An active administrator already exists for this email. No changes made.');
    return;
  }
  await prisma.users.create({ data: {
    email, full_name: 'SopPe Fake Administrator', role: 'admin', status: 'active',
    password_hash: await bcrypt.hash(password, 12),
  } });
  console.log('Administrator created. Sign in with the supplied email and password.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
