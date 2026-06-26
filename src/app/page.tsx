import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import HeroCarousel from "@/components/HeroCarousel"
import ContentRow from "@/components/ContentRow"
import Footer from "@/components/Footer"
import { tmdb } from "@/lib/tmdb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const revalidate = 60 // revalidate every minute

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function getHomeData() {
  // First, check if we have any movies in DB
  const count = await prisma.movie.count()
  
  // If DB is totally empty (first run), let's auto-import some trending content
  if (count === 0 && process.env.TMDB_API_KEY && process.env.TMDB_API_KEY !== "mock-tmdb-api-key") {
    try {
      const trendingMovies = await tmdb.getTrendingMovies()
      for (const m of trendingMovies.results.slice(0, 5)) {
        await tmdb.importMovieToDb(m.id)
      }
    } catch (e) {
      console.log("Failed to auto-seed", e)
    }
  }

  // Fetch data from DB - Top Kinopoisk only (with kinopoiskId)
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв'];
  const [topKinopoiskMoviesRaw, newReleases, topKinopoiskSeriesRaw, recentMovies, recentSeries] = await Promise.all([
    prisma.movie.findMany({ 
      where: { 
        kinopoiskId: { not: null }, 
        rating: { gte: 7.5 }, 
        videoSources: { some: {} },
        genres: { none: { genre: { slug: { in: excludedGenres } } } }
      }, 
      orderBy: { rating: 'desc' }, 
      take: 100 
    }),
    prisma.movie.findMany({ 
      where: { 
        videoSources: { some: {} },
        genres: { none: { genre: { slug: { in: excludedGenres } } } }
      }, 
      orderBy: [{ year: 'desc' }, { rating: 'desc' }], 
      take: 15 
    }),
    prisma.series.findMany({ 
      where: { 
        kinopoiskId: { not: null }, 
        rating: { gte: 7.5 },
        genres: { none: { genre: { slug: { in: excludedGenres } } } }
      }, 
      orderBy: { rating: 'desc' }, 
      take: 100 
    }),
    prisma.movie.findMany({ where: { videoSources: { some: {} } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.series.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ])

  const topKinopoiskMovies = shuffleArray(topKinopoiskMoviesRaw).slice(0, 15);
  const topKinopoiskSeries = shuffleArray(topKinopoiskSeriesRaw).slice(0, 15);

  // Map to common structure
  const mapContent = (items: any[], type: "movie" | "series") => 
    items.map(i => ({ ...i, type }))

  const recentlyAdded = [...mapContent(recentMovies, "movie"), ...mapContent(recentSeries, "series")]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15)

  // We will build the hero content after calculating recommendations

  // Fetch WatchHistory & generate Recommendations if user is logged in
  const session = await getServerSession(authOptions)
  let recentlyWatched: any[] = []
  let recommended: any[] = []

  const userId = (session?.user as any)?.id;
  if (userId) {
    const history = await prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { lastWatched: 'desc' },
      take: 15,
      include: { movie: true, series: true }
    })

    recentlyWatched = history.map(h => {
      if (h.movie) return { ...h.movie, type: "movie" }
      if (h.series) return { ...h.series, type: "series" }
      return null
    }).filter(Boolean)

    // SMART RECOMMENDATION ENGINE (AI-based on weights)
    const [favorites, ratings] = await Promise.all([
      prisma.favorite.findMany({ where: { userId }, include: { movie: { include: { genres: { include: { genre: true } } } } } }),
      prisma.rating.findMany({ where: { userId, value: { gte: 4 } }, include: { movie: { include: { genres: { include: { genre: true } } } } } })
    ])
    
    const genreWeights: Record<string, number> = {}
    const addGenres = (movie: any, weight: number) => {
      if (!movie?.genres) return
      movie.genres.forEach((mg: any) => {
        if (mg.genre?.slug) {
          genreWeights[mg.genre.slug] = (genreWeights[mg.genre.slug] || 0) + weight
        }
      })
    }
    
    favorites.forEach(f => addGenres(f.movie, 2))
    ratings.forEach(r => addGenres(r.movie, 3))
    recentlyWatched.forEach(m => {
       // Optional: could add logic here
    })

    const topGenres = Object.entries(genreWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0])

    if (topGenres.length > 0) {
      const excludeIds = new Set([
        ...favorites.map(f => f.movieId).filter(Boolean),
        ...ratings.map(r => r.movieId).filter(Boolean),
        ...recentlyWatched.map(r => r.id)
      ])
      
      const recMovies = await prisma.movie.findMany({
        where: {
          id: { notIn: Array.from(excludeIds) as string[] },
          genres: { 
            some: { genre: { slug: { in: topGenres } } },
            none: { genre: { slug: { in: excludedGenres } } }
          },
          rating: { gte: 7.0 },
          videoSources: { some: {} }
        },
        orderBy: { rating: 'desc' },
        take: 50
      })
      recommended = mapContent(shuffleArray(recMovies).slice(0, 15), "movie")
    }
  }

  // Hero Carousel: user's recent watches first, fallback to top Kinopoisk
  let heroSelection: any[] = [];
  
  if (recentlyWatched.length >= 3) {
    // User has watch history — show what they recently watched
    heroSelection = recentlyWatched.slice(0, 5);
  } else {
    // No history or not enough — show top Kinopoisk movies + series
    const topMovies = mapContent(topKinopoiskMovies, "movie").slice(0, 3);
    const topSeries = mapContent(topKinopoiskSeries, "series").slice(0, 2);
    heroSelection = [...topMovies, ...topSeries];
  }

  return {
    heroContent: heroSelection,
    popularMovies: mapContent(topKinopoiskMovies.slice(0, 15), "movie"),
    newReleases: mapContent(newReleases, "movie"),
    popularSeries: mapContent(topKinopoiskSeries.slice(0, 15), "series"),
    recentlyAdded,
    recentlyWatched,
    recommended,
  }
}

export default async function Home() {
  const data = await getHomeData()

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      {data.heroContent.length > 0 ? (
        <HeroCarousel items={data.heroContent} />
      ) : (
        <div className="h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Добро пожаловать в CINORA</h1>
            <p className="text-gray-400">Пожалуйста, перейдите в панель администратора для импорта контента из TMDB.</p>
          </div>
        </div>
      )}

      <div className="relative z-20 pb-20 -mt-32">
        {data.recommended.length > 0 && (
          <ContentRow title="Специально для вас" items={data.recommended} />
        )}
        {data.recentlyWatched.length > 0 && (
          <ContentRow title="Недавно просмотренные" items={data.recentlyWatched} />
        )}
        {data.recentlyAdded.length > 0 && (
          <ContentRow title="Недавно добавленные" items={data.recentlyAdded} />
        )}
        {data.newReleases.length > 0 && (
          <ContentRow title="Новинки кино" items={data.newReleases} />
        )}
        {data.popularMovies.length > 0 && (
          <ContentRow title="Топ Кинопоиска: Фильмы" items={data.popularMovies} />
        )}
        {data.popularSeries.length > 0 && (
          <ContentRow title="Топ Кинопоиска: Сериалы" items={data.popularSeries} />
        )}
      </div>

      <Footer />
    </main>
  )
}
