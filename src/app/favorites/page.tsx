import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import ContentCard from "@/components/ContentCard"
export const dynamic = 'force-dynamic'

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.email) {
    redirect("/login?from=/favorites")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect("/login?from=/favorites")
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      movie: true,
      series: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const movieFavorites = favorites.filter(f => f.movie).map(f => ({
    ...f.movie!,
    type: "movie" as const
  }))

  const seriesFavorites = favorites.filter(f => f.series).map(f => ({
    ...f.series!,
    type: "series" as const
  }))

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-8">Мой список</h1>

        {favorites.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <h2 className="text-xl mb-4">В вашем списке пока пусто</h2>
            <p>Добавляйте фильмы и сериалы, чтобы посмотреть их позже.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {movieFavorites.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
                  Фильмы
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {movieFavorites.map((movie) => (
                    <ContentCard key={movie.id} item={movie} />
                  ))}
                </div>
              </section>
            )}

            {seriesFavorites.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  Сериалы
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {seriesFavorites.map((series) => (
                    <ContentCard key={series.id} item={series} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
