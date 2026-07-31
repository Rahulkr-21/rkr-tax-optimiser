import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Required for Neon to run outside of the browser/edge environment
neonConfig.webSocketConstructor = ws;

// Create the adapter directly using the connection string (No Pool required!)
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaNeon({ connectionString });

// Instantiate Prisma with the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.taxConfig.upsert({
    where: { taxYear: '2026/27' },
    update: { isCurrent: true },
    create: {
      taxYear: '2026/27',
      isCurrent: true,
      standardAllowance: 12570,
      basicLimit: 37700,
      additionalThreshold: 125140,
      scotStarterRate: 0.19,
      scotBasicRate: 0.20,
      scotIntermediateRate: 0.21,
      scotHigherRate: 0.42,
      scotAdvancedRate: 0.45,
      scotTopRate: 0.48,
    },
  });
  console.log('Database seeded with 2026/27 Tax Data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });