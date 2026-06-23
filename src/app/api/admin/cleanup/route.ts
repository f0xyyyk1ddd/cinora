import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60 // Allows vercel/next function to run for 60s if needed

async function checkVideoExists(id: string, type: 'movies' | 'series') {
  try {
    const balancerRes = await fetch(`https://fbphdplay.top/api/players?kinopoisk=${id}`, { 
      signal: AbortSignal.timeout(5000),
      headers: {
        'Referer': 'https://cinora.ru/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (balancerRes.ok) {
      const balancerJson = await balancerRes.json()
      if (balancerJson.data && Array.isArray(balancerJson.data) && balancerJson.data.length > 0) {
        const hasVideo = balancerJson.data.some((p: any) => p.iframeUrl !== null)
        return hasVideo
      }
      return false
    }
    
    return true; // Fallback in case API goes down
  } catch (e) {
    return true; // Don't delete if there's a network error
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { offset = 0, limit = 50, type = 'movies' } = body

    let items;
    if (type === 'movies') {
      items = await prisma.movie.findMany({
        skip: offset,
        take: limit,
        select: { id: true, kinopoiskId: true, title: true }
      })
    } else {
      items = await prisma.series.findMany({
        skip: offset,
        take: limit,
        select: { id: true, kinopoiskId: true, title: true }
      })
    }

    if (items.length === 0) {
      return NextResponse.json({ processed: 0, deleted: 0, done: true })
    }

    let deletedCount = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.kinopoiskId) continue

      const hasVideo = await checkVideoExists(item.kinopoiskId.toString(), type)
      
      if (!hasVideo) {
        if (type === 'movies') {
          await prisma.movie.delete({ where: { id: item.id } })
        } else {
          await prisma.series.delete({ where: { id: item.id } })
        }
        deletedCount++
        
        await prisma.blacklist.upsert({
          where: { kinopoiskId: item.kinopoiskId },
          update: {},
          create: { kinopoiskId: item.kinopoiskId }
        })
      }
      
      // small delay
      await new Promise(r => setTimeout(r, 100))
    }

    return NextResponse.json({ 
      processed: items.length, 
      deleted: deletedCount, 
      done: items.length < limit 
    })
  } catch (error) {
    console.error("Cleanup API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
