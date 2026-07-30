import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();
const pepper = process.env.BCRYPT_PEPPER || '';

async function deleteIfExists(model: any) {
  try { await model.deleteMany(); } catch { /* table may not exist yet */ }
}

async function main() {
  console.log('Resetting database — creating single user...');

  await deleteIfExists(prisma.oAuthAccount);
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

  const passwordHash = await argon2.hash('Laxmi@2026' + pepper, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
  });

  const user = await prisma.user.create({
    data: {
      email: 'lcdhuvare3010@gmail.com',
      passwordHash,
      name: 'Laxmi Chandra',
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
      preferences: {
        create: { language: 'en', theme: 'slate' },
      },
    },
  });

  console.log(`Created user: ${user.email} (${user.role})`);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
