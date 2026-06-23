import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ type: string, id: string }> }) {
  try {
    const { type, id } = await params;

    if (type === 'movie') {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          genres: { include: { genre: true } },
          videoSources: true
        }
      });
      if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(movie);
    } 
    
    if (type === 'series') {
      const series = await prisma.series.findUnique({
        where: { id },
        include: {
          genres: { include: { genre: true } },
          seasons: {
            include: {
              episodes: {
                include: { videoSources: true }
              }
            }
          }
        }
      });
      if (!series) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(series);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error) {
    console.error('API /tv/details Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
