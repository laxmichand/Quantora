import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123' + (process.env.BCRYPT_PEPPER || ''), 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@quantora.com' },
    update: {},
    create: {
      email: 'admin@quantora.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      isEmailVerified: true,
      preferences: {
        create: { language: 'en', theme: 'slate' },
      },
    },
  });
  console.log('Created admin user:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123' + (process.env.BCRYPT_PEPPER || ''), 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@quantora.com' },
    update: {},
    create: {
      email: 'demo@quantora.com',
      passwordHash: demoPassword,
      name: 'Demo User',
      role: 'user',
      isEmailVerified: true,
      preferences: {
        create: { language: 'en', theme: 'slate' },
      },
    },
  });
  console.log('Created demo user:', demo.email);

  // Create demo portfolio for demo user
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: demo.id,
      name: 'My Investment Portfolio',
      benchmark: 'NIFTY_50',
    },
  });
  console.log('Created portfolio:', portfolio.name);

  // Create demo holdings
  const holdings = [
    { stockSymbol: 'ITC', quantity: 50, avgBuyPrice: 450.0 },
    { stockSymbol: 'HDFCBANK', quantity: 25, avgBuyPrice: 1600.0 },
    { stockSymbol: 'INFY', quantity: 30, avgBuyPrice: 1450.0 },
    { stockSymbol: 'RELIANCE', quantity: 15, avgBuyPrice: 2800.0 },
    { stockSymbol: 'TCS', quantity: 20, avgBuyPrice: 3800.0 },
  ];

  for (const holding of holdings) {
    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        ...holding,
      },
    });
  }
  console.log('Created', holdings.length, 'holdings');

  // Create demo goal
  const goal = await prisma.goal.create({
    data: {
      userId: demo.id,
      name: 'Retirement Fund',
      targetAmount: 5000000,
      currentAmount: 1250000,
      deadline: new Date('2045-12-31'),
      type: 'retirement',
      sipAmount: 25000,
      riskTolerance: 'moderate',
    },
  });
  console.log('Created goal:', goal.name);

  // Create demo subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId: demo.id,
      plan: 'free',
      status: 'active',
    },
  });
  console.log('Created subscription:', subscription.plan);

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
