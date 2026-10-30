const path = require('path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
async function checkDatabase() {
  let prisma;
  try {
    prisma = require('./config/database');
    const count = await prisma.users.count();
    console.log(`Database connection verified; ${count} account(s).`);
  } catch {
    console.error('Database connection check failed. Check DATABASE_URL, generated Prisma Client, and MySQL availability.');
    process.exitCode = 1;
  } finally {
    if (prisma) {
      try { await prisma.$disconnect(); }
      catch { console.error('Database disconnect failed.');process.exitCode=1; }
    }
  }
}
checkDatabase();
