const { PrismaClient } = require('@prisma/client');

// Render and Aiven can be in different regions. Prisma's 5-second default is
// too short for several related reads/writes over that connection. Keep a
// bounded budget shared by checkout, order actions, reviews and other writes.
module.exports = new PrismaClient({
  transactionOptions: { maxWait: 10000, timeout: 30000 },
});
