import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteIfExists(model: any) {
  try {
    await model.deleteMany();
  } catch {
    /* table may not exist yet */
  }
}

async function main() {
  console.log('Resetting database — clearing all data...');

  await deleteIfExists(prisma.oAuthAccount);
  await deleteIfExists(prisma.notification);
  await deleteIfExists(prisma.blockedIp);
  await deleteIfExists(prisma.securityEvent);
  await deleteIfExists(prisma.session);
  await deleteIfExists(prisma.device);
  await deleteIfExists(prisma.loginHistory);
  await deleteIfExists(prisma.auditLog);
  await deleteIfExists(prisma.refreshToken);
  await deleteIfExists(prisma.holding);
  await deleteIfExists(prisma.watchlist);
  await deleteIfExists(prisma.alert);
  await deleteIfExists(prisma.goal);
  await deleteIfExists(prisma.portfolio);
  await deleteIfExists(prisma.subscription);
  await deleteIfExists(prisma.userPreference);
  await deleteIfExists(prisma.user);

  console.log('Database cleared — ready for fresh registration');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
