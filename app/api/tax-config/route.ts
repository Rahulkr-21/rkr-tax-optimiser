// src/app/api/tax-config/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Required for Neon's serverless driver
neonConfig.webSocketConstructor = ws;

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const activeConfig = await prisma.taxConfig.findFirst({
      where: { isCurrent: true },
    });

    if (!activeConfig) {
      return NextResponse.json(
        { error: 'No active tax configuration found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(activeConfig, { status: 200 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax configuration.' },
      { status: 500 }
    );
  }
}