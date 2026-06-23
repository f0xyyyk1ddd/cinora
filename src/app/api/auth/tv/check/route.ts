import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signJwt } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { deviceId, code } = await req.json();

    if (!deviceId || !code) {
      return NextResponse.json({ error: 'Device ID and code required' }, { status: 400 });
    }

    const authCode = await prisma.tvAuthCode.findFirst({
      where: {
        deviceId,
        code,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!authCode) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // If userId is populated, it means the user successfully entered the code on the web
    if (authCode.userId && authCode.user) {
      const token = signJwt({ 
        id: authCode.user.id, 
        email: authCode.user.email, 
        role: authCode.user.role 
      });

      // We can delete the code now
      await prisma.tvAuthCode.delete({
        where: { id: authCode.id }
      });

      return NextResponse.json({
        authorized: true,
        token,
        user: {
          id: authCode.user.id,
          email: authCode.user.email,
          name: authCode.user.name,
          role: authCode.user.role
        }
      });
    }

    // Still waiting
    return NextResponse.json({ authorized: false });

  } catch (error) {
    console.error('TV Auth Check Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
