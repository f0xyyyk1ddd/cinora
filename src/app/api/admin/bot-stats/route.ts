import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.BOT_SECRET_KEY}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const movieCount = await prisma.movie.count();
    const seriesCount = await prisma.series.count();
    const premiumMovieCount = await prisma.movie.count({ where: { isPremium: true } });
    const premiumSeriesCount = await prisma.series.count({ where: { isPremium: true } });

    return NextResponse.json({
      success: true,
      stats: {
        movieCount,
        seriesCount,
        premiumMovieCount,
        premiumSeriesCount,
      }
    });
  } catch (error) {
    console.error('[BOT_STATS_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
