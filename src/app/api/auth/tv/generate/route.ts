import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { deviceId } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 });
    }

    // Delete any old codes for this device
    await prisma.tvAuthCode.deleteMany({
      where: { deviceId }
    });

    // Generate a new 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const authCode = await prisma.tvAuthCode.create({
      data: {
        code,
        deviceId,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15) // 15 mins
      }
    });

    return NextResponse.json({ code: authCode.code });
  } catch (error) {
    console.error('TV Auth Generate Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
