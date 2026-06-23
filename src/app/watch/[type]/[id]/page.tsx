import prisma from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import VideoPlayer from "@/components/VideoPlayer"
import { kinopoisk } from "@/lib/kinopoisk"
export const dynamic = 'force-dynamic'

export default async function WatchPage({ 
  params 
}: { 
  params: Promise<{ type: string, id: string }> 
}) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions)
  
  // if (!session) {
  //   redirect(`/login?from=/watch/${resolvedParams.type}/${resolvedParams.id}`)
  // }

  let content = null
  let sources: any[] = []

  if (resolvedParams.type === "movie") {
    content = await prisma.movie.findUnique({
      where: { id: resolvedParams.id },
      include: { videoSources: true }
    })
    sources = content?.videoSources || []
  } else if (resolvedParams.type === "series") {
    content = await prisma.series.findUnique({
      where: { id: resolvedParams.id }
    })
    sources = []
  }

  console.log("WATCH PAGE DEBUG:", { id: resolvedParams.id, type: resolvedParams.type, content_exists: !!content, kpId: content?.kinopoiskId })

  if (sources.length === 0) {
    sources = []

    if (content && content.kinopoiskId) {
      sources.push({
        id: "source-fb",
        title: "Kinokino (RU)",
        provider: "Kinokino",
        embedUrl: resolvedParams.type === "series" ? `https://kinokino.vip/series/${content.kinopoiskId}/` : `https://kinokino.vip/film/${content.kinopoiskId}/`,
        priority: 0,
        active: true,
        movieId: resolvedParams.type === "movie" ? content.id : null,
        episodeId: resolvedParams.type === "series" ? content.id : null,
        createdAt: new Date().toISOString()
      })
    }
  }

  if (content?.isPremium) {
    const user = session?.user as any;
    if (!session || (user?.role !== 'PREMIUM' && user?.role !== 'ADMIN')) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-black text-white p-4">
          <div className="text-center max-w-md bg-white/5 border border-purple-500/30 p-8 rounded-2xl backdrop-blur-md">
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Доступ только по подписке</h1>
            <p className="text-gray-300 mb-6">
              Этот {resolvedParams.type === 'movie' ? 'фильм' : 'сериал'} доступен только для пользователей с Premium-подпиской.
            </p>
            <a href="/premium" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105 inline-block">
              Оформить подписку
            </a>
          </div>
        </div>
      )
    }
  }

  // Save Watch History if user is logged in
  if (session?.user && content) {
    const userId = (session.user as any).id
    if (userId) {
      if (resolvedParams.type === "movie") {
        const existing = await prisma.watchHistory.findFirst({
          where: { userId, movieId: content.id }
        })
        if (existing) {
          await prisma.watchHistory.update({
            where: { id: existing.id },
            data: { lastWatched: new Date() }
          })
        } else {
          await prisma.watchHistory.create({
            data: { userId, movieId: content.id }
          })
        }
      } else if (resolvedParams.type === "series") {
        const existing = await prisma.watchHistory.findFirst({
          where: { userId, seriesId: content.id }
        })
        if (existing) {
          await prisma.watchHistory.update({
            where: { id: existing.id },
            data: { lastWatched: new Date() }
          })
        } else {
          await prisma.watchHistory.create({
            data: { userId, seriesId: content.id }
          })
        }
      }
    }
  }

  // Next.js Server Components cannot pass Date objects to Client Components.
  // Sanitize sources to ensure JSON serialization works properly.
  const serializedSources = JSON.parse(JSON.stringify(sources));

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <VideoPlayer 
        content={{
          id: content?.id || resolvedParams.id,
          tmdbId: content?.tmdbId || null,
          title: content?.title || "Unknown",
          type: resolvedParams.type,
        }} 
        sources={serializedSources} 
      />
    </div>
  )
}
