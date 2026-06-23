import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.BOT_SECRET_KEY}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json(); // Kinopoisk ID or internal ID
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Check movies
    let movie = await prisma.movie.findFirst({ where: { kinopoiskId: id } });
    if (!movie) {
      movie = await prisma.movie.findFirst({ where: { id } });
    }

    if (movie) {
      const updated = await prisma.movie.update({
        where: { id: movie.id },
        data: { isPremium: !movie.isPremium }
      });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, type: 'movie', title: movie.title, isPremium: updated.isPremium });
    }

    // Check series
    let series = await prisma.series.findFirst({ where: { kinopoiskId: id } });
    if (!series) {
      series = await prisma.series.findFirst({ where: { id } });
    }

    if (series) {
      const updated = await prisma.series.update({
        where: { id: series.id },
        data: { isPremium: !series.isPremium }
      });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, type: 'series', title: series.title, isPremium: updated.isPremium });
    }

    return NextResponse.json({ success: false, error: 'Project not found with this ID' }, { status: 404 });
  } catch (error) {
    console.error('[BOT_PREMIUM_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
