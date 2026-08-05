import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '..', '..', '.env') });

const prisma = new PrismaClient();

const ARGON_MEMORY_COST = 19456;
const ARGON_TIME_COST = 2;
const pepper = process.env.BCRYPT_PEPPER || '';

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password + pepper, {
    type: argon2.argon2id,
    memoryCost: ARGON_MEMORY_COST,
    timeCost: ARGON_TIME_COST,
  });
}

async function deleteIfExists(model: any) {
  try {
    await model.deleteMany();
  } catch {
    /* table may not exist yet */
  }
}

async function upsertUser(input: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<{ id: string }> {
  const passwordHash = await hashPassword(input.password);
  return prisma.user.upsert({
    where: { email: input.email },
    update: { passwordHash, name: input.name, role: input.role, isActive: true },
    create: {
      email: input.email,
      passwordHash,
      name: input.name,
      role: input.role,
      provider: 'local',
      isEmailVerified: true,
      preferences: { create: { language: 'en', theme: 'slate' } },
    },
    select: { id: true },
  });
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

  console.log('Database cleared — seeding accounts...');

  const admin = await upsertUser({
    email: 'admin@quantora.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
  });
  console.log(`Created admin user: admin@quantora.com (${admin.id})`);

  const demo = await upsertUser({
    email: 'demo@quantora.com',
    password: 'demo123',
    name: 'Demo',
    role: 'user',
  });
  console.log(`Created demo user: demo@quantora.com (${demo.id})`);

  await upsertUser({
    email: 'test@test.com',
    password: 'Test1234',
    name: 'Test',
    role: 'user',
  });
  console.log('Created test user: test@test.com');

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: demo.id,
      name: 'My Investment Portfolio',
      benchmark: 'NIFTY_50',
      holdings: {
        create: [
          { stockSymbol: 'ITC', quantity: 50, avgBuyPrice: 400 },
          { stockSymbol: 'HDFCBANK', quantity: 25, avgBuyPrice: 1700 },
          { stockSymbol: 'INFY', quantity: 30, avgBuyPrice: 1500 },
          { stockSymbol: 'RELIANCE', quantity: 15, avgBuyPrice: 2900 },
          { stockSymbol: 'TCS', quantity: 20, avgBuyPrice: 3800 },
        ],
      },
    },
  });
  console.log(`Created demo portfolio: ${portfolio.name}`);

  await prisma.goal.create({
    data: {
      userId: demo.id,
      name: 'Retirement Fund',
      targetAmount: 5000000,
      currentAmount: 1250000,
      deadline: new Date('2035-12-31'),
      type: 'retirement',
    },
  });
  console.log('Created demo goal: Retirement Fund');

  await prisma.subscription.create({
    data: {
      userId: demo.id,
      plan: 'free',
      status: 'active',
      currency: 'INR',
    },
  });
  console.log('Created demo subscription: free plan');

  console.log('');
  console.log('✅ Seed complete!');
  console.log('   Admin: admin@quantora.com / admin123');
  console.log('   Demo:  demo@quantora.com / demo123');
  console.log('   Test:  test@test.com / Test1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
