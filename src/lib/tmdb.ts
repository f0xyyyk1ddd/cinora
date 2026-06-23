import prisma from "./db"
import { kinopoisk } from "./kinopoisk"

const TMDB_API_KEY = process.env.TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.append("api_key", TMDB_API_KEY || "")
  url.searchParams.append("language", "ru-RU")
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) {
    throw new Error(`TMDB Error: ${res.statusText}`)
  }
  return res.json()
}

export const tmdb = {
  async searchMovies(query: string) {
    return fetchFromTMDB("/search/movie", { query })
  },

  async searchSeries(query: string) {
    return fetchFromTMDB("/search/tv", { query })
  },

  async getMovieDetails(tmdbId: number) {
    return fetchFromTMDB(`/movie/${tmdbId}`, {
      append_to_response: "videos,credits,external_ids",
    })
  },

  async getSeriesDetails(tmdbId: number) {
    return fetchFromTMDB(`/tv/${tmdbId}`, {
      append_to_response: "videos,credits,external_ids",
    })
  },

  async getTrendingMovies() {
    return fetchFromTMDB("/trending/movie/week")
  },

  async getTrendingSeries() {
    return fetchFromTMDB("/trending/tv/week")
  },

  async importMovieToDb(tmdbId: number) {
    const data = await this.getMovieDetails(tmdbId)
    
    // Find trailer
    const trailer = data.videos?.results?.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    )

    // Try Kinopoisk first
    const finalPosterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
    const finalBackdropUrl = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null

    // Verify video exists in Kinokino backend (fbphdplay.top) using IMDB ID
    if (data.external_ids && data.external_ids.imdb_id) {
      try {
        const balancerRes = await fetch(`https://fbphdplay.top/api/players?imdb=${data.external_ids.imdb_id}`, { 
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
            if (!hasVideo) {
              throw new Error(`Отклонено фильтром: Видео не найдено в базе Kinokino`)
            }
          } else {
            throw new Error(`Отклонено фильтром: Видео не найдено в базе Kinokino`)
          }
        }
      } catch (e: any) {
        if (e.message.includes('Отклонено фильтром')) {
          throw e;
        }
        console.log("Balancer check warning for TMDB:", e.message)
      }
    }

    // Ensure genres exist
    const genres = await Promise.all(
      data.genres.map(async (g: any) => {
        return prisma.genre.upsert({
          where: { tmdbId: g.id },
          update: { name: g.name, slug: g.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-') },
          create: {
            tmdbId: g.id,
            name: g.name,
            slug: g.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-'),
          }
        })
      })
    )

    // Upsert movie
    const movie = await prisma.movie.upsert({
      where: { tmdbId: data.id },
      update: {
        title: data.title,
        originalTitle: data.original_title,
        description: data.overview,
        year: new Date(data.release_date).getFullYear() || 0,
        runtime: data.runtime,
        rating: data.vote_average,
        posterUrl: finalPosterUrl,
        backdropUrl: finalBackdropUrl,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      },
      create: {
        tmdbId: data.id,
        title: data.title,
        originalTitle: data.original_title,
        description: data.overview || "",
        year: data.release_date ? new Date(data.release_date).getFullYear() : 0,
        runtime: data.runtime,
        rating: data.vote_average,
        posterUrl: finalPosterUrl,
        backdropUrl: finalBackdropUrl,
        trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      }
    })

    // Update genres relations
    for (const genre of genres) {
      await prisma.movieGenre.upsert({
        where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
        update: {},
        create: { movieId: movie.id, genreId: genre.id }
      })
    }

    return movie
  },

  async importSeriesToDb(tmdbId: number) {
    const data = await this.getSeriesDetails(tmdbId)
    
    // Find trailer
    const trailer = data.videos?.results?.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    )

    // Try Kinopoisk first
    const finalPosterUrl = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null
    const finalBackdropUrl = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null

    // Verify video exists in Kinokino backend (fbphdplay.top) using IMDB ID
    if (data.external_ids && data.external_ids.imdb_id) {
      try {
        const balancerRes = await fetch(`https://fbphdplay.top/api/players?imdb=${data.external_ids.imdb_id}`, { 
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
            if (!hasVideo) {
              throw new Error(`Отклонено фильтром: Видео не найдено в базе Kinokino`)
            }
          } else {
            throw new Error(`Отклонено фильтром: Видео не найдено в базе Kinokino`)
          }
        }
      } catch (e: any) {
        if (e.message.includes('Отклонено фильтром')) {
          throw e;
        }
        console.log("Balancer check warning for TMDB:", e.message)
      }
    }

    // Ensure genres exist
    const genres = await Promise.all(
      data.genres.map(async (g: any) => {
        return prisma.genre.upsert({
          where: { tmdbId: g.id },
          update: { name: g.name, slug: g.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-') },
          create: {
            tmdbId: g.id,
            name: g.name,
            slug: g.name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-'),
          }
        })
      })
    )

    // Upsert series
    const series = await prisma.series.upsert({
      where: { tmdbId: data.id },
      update: {
        title: data.name,
        originalTitle: data.original_name,
        description: data.overview,
        year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0,
        rating: data.vote_average,
        posterUrl: finalPosterUrl,
        backdropUrl: finalBackdropUrl,
      },
      create: {
        tmdbId: data.id,
        title: data.name,
        originalTitle: data.original_name,
        description: data.overview || "",
        year: data.first_air_date ? new Date(data.first_air_date).getFullYear() : 0,
        rating: data.vote_average,
        posterUrl: finalPosterUrl,
        backdropUrl: finalBackdropUrl,
      }
    })

    // Update genres relations
    for (const genre of genres) {
      await prisma.seriesGenre.upsert({
        where: { seriesId_genreId: { seriesId: series.id, genreId: genre.id } },
        update: {},
        create: { seriesId: series.id, genreId: genre.id }
      })
    }

    return series
  }
}
