import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const series = await prisma.series.findUnique({
      where: { id: resolvedParams.id },
      select: { kinopoiskId: true }
    });

    if (!series) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // Add to blacklist so it doesn't get re-imported
    if (series.kinopoiskId) {
      await prisma.blacklist.upsert({
        where: { kinopoiskId: series.kinopoiskId },
        update: {},
        create: { kinopoiskId: series.kinopoiskId }
      });
    }

    // Delete relation records manually if Cascade doesn't cover some edges
    await prisma.seriesGenre.deleteMany({ where: { seriesId: resolvedParams.id } });
    await prisma.series.delete({ where: { id: resolvedParams.id } });

    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[ADMIN_SERIES_DELETE]", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { isPremium } = body;

    const series = await prisma.series.update({
      where: { id: resolvedParams.id },
      data: { isPremium }
    });

    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, series })
  } catch (error: any) {
    console.error("[ADMIN_SERIES_PATCH]", error)
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}
