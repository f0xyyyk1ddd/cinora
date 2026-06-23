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
      if (movie.kinopoiskId) {
        await prisma.blacklist.upsert({
          where: { kinopoiskId: movie.kinopoiskId },
          update: {},
          create: { kinopoiskId: movie.kinopoiskId }
        });
      }
      await prisma.movieGenre.deleteMany({ where: { movieId: movie.id } });
      await prisma.movie.delete({ where: { id: movie.id } });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, type: 'movie', title: movie.title });
    }

    // Check series
    let series = await prisma.series.findFirst({ where: { kinopoiskId: id } });
    if (!series) {
      series = await prisma.series.findFirst({ where: { id } });
    }

    if (series) {
      if (series.kinopoiskId) {
        await prisma.blacklist.upsert({
          where: { kinopoiskId: series.kinopoiskId },
          update: {},
          create: { kinopoiskId: series.kinopoiskId }
        });
      }
      await prisma.seriesGenre.deleteMany({ where: { seriesId: series.id } });
      await prisma.series.delete({ where: { id: series.id } });
      revalidatePath('/', 'layout');
      return NextResponse.json({ success: true, type: 'series', title: series.title });
    }

    return NextResponse.json({ success: false, error: 'Project not found with this ID' }, { status: 404 });
  } catch (error) {
    console.error('[BOT_DELETE_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
