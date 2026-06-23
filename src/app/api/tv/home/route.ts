import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const [recentMovies, popularMovies, recentSeries, popularSeries] = await Promise.all([
      // 1. Recently added movies
      prisma.movie.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // 2. Popular movies (by rating)
      prisma.movie.findMany({
        take: 10,
        orderBy: { rating: 'desc' },
      }),
      // 3. Recently added series
      prisma.series.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      // 4. Popular series (by rating)
      prisma.series.findMany({
        take: 10,
        orderBy: { rating: 'desc' },
      }),
    ]);

    return NextResponse.json({
      recentMovies: recentMovies.map(m => ({ ...m, type: 'movie' })),
      popularMovies: popularMovies.map(m => ({ ...m, type: 'movie' })),
      recentSeries: recentSeries.map(s => ({ ...s, type: 'series' })),
      popularSeries: popularSeries.map(s => ({ ...s, type: 'series' }))
    });

  } catch (error) {
    console.error('API /tv/home Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
