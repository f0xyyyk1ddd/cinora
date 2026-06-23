import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ProfileClient from "@/components/ProfileClient"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userId = (session.user as any)?.id

  // Fetch all profile data in parallel
  const [favorites, watchHistory, ratings, dbUser] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: { movie: true, series: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.watchHistory.findMany({
      where: { userId },
      include: { movie: true, series: true },
      orderBy: { lastWatched: 'desc' },
      take: 50
    }),
    prisma.rating.findMany({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, createdAt: true }
    })
  ])

  // Map favorites to a flat array
  const favoritesFlat = favorites.map(f => {
    if (f.movie) return { ...f.movie, type: "movie" as const }
    if (f.series) return { ...f.series, type: "series" as const }
    return null
  }).filter(Boolean)

  // Map watch history to a flat array
  const historyFlat = watchHistory.map(h => {
    if (h.movie) return { ...h.movie, type: "movie" as const, lastWatched: h.lastWatched.toISOString() }
    if (h.series) return { ...h.series, type: "series" as const, lastWatched: h.lastWatched.toISOString() }
    return null
  }).filter(Boolean)

  // Serialize dates to strings for client component
  const serializeItem = (item: any) => ({
    id: item.id,
    title: item.title,
    posterUrl: item.posterUrl,
    backdropUrl: item.backdropUrl,
    year: item.year,
    rating: item.rating,
    type: item.type,
    lastWatched: item.lastWatched || null,
  })

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 md:px-12 max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Настройки аккаунта</h1>
          <p className="text-gray-400">Управляйте своим профилем и подпиской</p>
        </div>

        <ProfileClient
          user={{
            name: session.user?.name,
            email: session.user?.email,
            role: dbUser?.role || "USER",
            createdAt: dbUser?.createdAt?.toISOString()
          }}
          favorites={favoritesFlat.map(serializeItem)}
          watchHistory={historyFlat.map(serializeItem)}
          likedCount={ratings.length}
        />
      </div>
      
      <Footer />
    </main>
  )
}
