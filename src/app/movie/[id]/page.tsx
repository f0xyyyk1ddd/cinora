import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import MovieActions from "@/components/MovieActions"
import { notFound } from "next/navigation"
import { Play, Star, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import ContentRow from "@/components/ContentRow"

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
    }
  })

  if (!movie) {
    notFound()
  }

  // Get some recommendations (only movies that have video sources)
  let recommended: any[] = []
  if (movie.genres && movie.genres.length > 0) {
    const recommendedRaw = await prisma.movie.findMany({
      where: {
        id: { not: movie.id },
        genres: { some: { genreId: { in: movie.genres.map(g => g.genreId) } } },
      },
      take: 100,
      orderBy: { rating: 'desc' },
      include: { genres: true }
    })
    
    // Sort by number of matching genres, then by rating
    recommendedRaw.sort((a, b) => {
      const overlapA = a.genres.filter(g => movie.genres.some(mg => mg.genreId === g.genreId)).length;
      const overlapB = b.genres.filter(g => movie.genres.some(mg => mg.genreId === g.genreId)).length;
      if (overlapB !== overlapA) return overlapB - overlapA;
      return b.rating - a.rating;
    });
    
    recommended = recommendedRaw.slice(0, 15);
  }

  // Fallback to top rated if no similar found
  if (recommended.length === 0) {
    recommended = await prisma.movie.findMany({
      where: { id: { not: movie.id } },
      take: 12,
      orderBy: { rating: 'desc' }
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero Backdrop */}
      <div className="relative w-full h-[70vh] md:h-[85vh]">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        <img 
          src={movie.backdropUrl || movie.posterUrl || "https://via.placeholder.com/1920x1080?text=No+Backdrop"} 
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute bottom-0 left-0 z-20 p-4 md:p-12 w-full max-w-7xl flex flex-col md:flex-row gap-8 items-end">
          <div className="hidden md:block w-64 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 glass-card">
            <img 
              src={movie.posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"} 
              alt={movie.title}
              className="w-full object-cover"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-shadow">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-300 mb-6">
              <span className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                {movie.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {movie.year}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {movie.runtime} мин
              </span>
              <span className="px-2 py-0.5 border border-gray-600 rounded text-xs">HD</span>
            </div>

            <p className="text-lg text-gray-200 mb-8 max-w-2xl leading-relaxed text-shadow line-clamp-4 md:line-clamp-6">
              {movie.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href={`/watch/movie/${movie.id}`}>
                <button className="flex items-center gap-2 px-8 py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                  <Play className="w-5 h-5" fill="currentColor" />
                  Смотреть
                </button>
              </Link>
              
              <MovieActions movieId={movie.id} type="movie" />
            </div>

            <div className="text-sm text-gray-400">
              <span className="text-gray-500">Жанры:</span>{" "}
              <span className="text-white">
                {movie.genres.map(g => g.genre.name).join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-8 pb-20">
        {recommended.length > 0 && (
          <ContentRow 
            title="Вам может понравится" 
            items={recommended.map(r => ({ ...r, type: "movie" }))} 
          />
        )}
      </div>

      <Footer />
    </main>
  )
}

