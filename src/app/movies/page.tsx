import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ContentCard from "@/components/ContentCard"
import MoviesFilter from "@/components/MoviesFilter"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default async function MoviesPage({ searchParams }: { searchParams: Promise<{ page?: string, genre?: string, year?: string, sort?: string }> }) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1")
  const genre = resolvedParams.genre || ""
  const year = resolvedParams.year || ""
  const sort = resolvedParams.sort || "rating"

  const take = 30
  const skip = (page - 1) * take

  // Build where clause — always require at least one video source
  const where: any = { videoSources: { some: {} } }
  
  if (genre) {
    where.genres = {
      some: {
        genre: { slug: genre }
      }
    }
  }

  if (year) {
    if (year.includes("-")) {
      const [start, end] = year.split("-").map(Number)
      where.year = { gte: start, lte: end }
    } else {
      where.year = parseInt(year)
    }
  }

  // Build orderBy clause
  let orderBy: any = { rating: 'desc' }
  if (sort === "newest") orderBy = { year: 'desc' }
  else if (sort === "oldest") orderBy = { year: 'asc' }
  else if (sort === "title_asc") orderBy = { title: 'asc' }
  else if (sort === "rating") orderBy = { rating: 'desc' }

  // We also need all genres for the filter component
  const [movies, totalCount, allGenres] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy,
      take,
      skip,
      include: { genres: { include: { genre: true } } }
    }),
    prisma.movie.count({ where }),
    prisma.genre.findMany({ orderBy: { name: 'asc' } })
  ])

  const totalPages = Math.ceil(totalCount / take)

  // Construct current URL params string for pagination links
  const params = new URLSearchParams()
  if (genre) params.set("genre", genre)
  if (year) params.set("year", year)
  if (sort) params.set("sort", sort)
  const queryString = params.toString() ? `&${params.toString()}` : ""

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="pt-24 px-4 md:px-12 pb-20 max-w-screen-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Фильмы</h1>
        
        <MoviesFilter genres={allGenres} />

        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
              {movies.map(movie => (
                <ContentCard key={movie.id} item={{ ...movie, type: "movie" }} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link href={`/movies?page=${page - 1}${queryString}`} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] rounded-lg text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                    Назад
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e]/50 text-gray-500 rounded-lg cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                    Назад
                  </div>
                )}
                
                <span className="text-gray-400">
                  Страница <span className="text-white font-medium">{page}</span> из {totalPages}
                </span>

                {page < totalPages ? (
                  <Link href={`/movies?page=${page + 1}${queryString}`} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] rounded-lg text-white transition-colors">
                    Вперед
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e]/50 text-gray-500 rounded-lg cursor-not-allowed">
                    Вперед
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Фильмы не найдены</h2>
            <p className="text-gray-500">Попробуйте изменить параметры фильтрации.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
