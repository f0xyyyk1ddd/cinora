import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Find the auth code
    const authCode = await prisma.tvAuthCode.findFirst({
      where: {
        code,
        expiresAt: { gt: new Date() },
        userId: null // Must not be already assigned
      }
    });

    if (!authCode) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Assign to the user
    await prisma.tvAuthCode.update({
      where: { id: authCode.id },
      data: { userId }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('TV Auth Submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
