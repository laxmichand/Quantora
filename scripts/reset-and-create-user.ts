import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  const prisma = new PrismaClient();

  // Delete in FK order
  console.log('Clearing all data...');
  await prisma.auditLog.deleteMany();
  await prisma.loginHistory.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.oAuthAccount.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();
  console.log('All data cleared.');

  // Create new user
  const pepper = process.env.BCRYPT_PEPPER || '';
  const passwordHash = await argon2.hash('Laxmi@2026' + pepper, {
    type: argon2.argon2id,
    memoryCost: 15000,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.create({
    data: {
      email: 'lcdhuvare3010@gmail.com',
      passwordHash,
      name: 'Laxmi Dhuvare',
      role: 'admin',
      isEmailVerified: true,
      provider: 'local',
    },
  });
  console.log('User created:', user.email, '(admin)');

  await prisma.userPreference.create({
    data: { userId: user.id },
  });
  console.log('Preferences created.');

  await prisma.$disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
