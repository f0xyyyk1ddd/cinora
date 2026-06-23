import prisma from "./db"
import { getKeys } from "./kinopoisk-keys"

let currentKeyIndex = 0

const BASE_URL = "https://kinopoiskapiunofficial.tech/api"

async function fetchWithRotation(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  let attempts = 0
  const keys = getKeys()
  let localKeyIndex = currentKeyIndex
  while (attempts < keys.length) {
    const key = keys[localKeyIndex % keys.length]
    const res = await fetch(url.toString(), {
      headers: {
        'X-API-KEY': key,
        'Content-Type': 'application/json',
      },
      cache: "no-store"
    })

    if (res.status === 401 || res.status === 402 || res.status === 429) {
      localKeyIndex = (localKeyIndex + 1) % keys.length
      currentKeyIndex = localKeyIndex
      attempts++
      console.log(`[KINOPOISK] Key invalid or exceeded (Status ${res.status}). Switching to key index ${localKeyIndex}`)
      continue
    }

    if (!res.ok) {
      if (res.status === 404) {
        return null // Not found
      }
      throw new Error(`Kinopoisk API Error: ${res.status} ${res.statusText}`)
    }

    return res.json()
  }

  throw new Error("QUOTA_EXCEEDED")
}

export const kinopoisk = {
  async getTopPopular(page = 1) {
    return fetchWithRotation("/v2.2/films/collections", { type: "TOP_POPULAR_ALL", page: page.toString() })
  },

  async getPremieres(year: number, month: string) {
    return fetchWithRotation("/v2.2/films/premieres", { year: year.toString(), month })
  },
  
  async searchByYear(year: number, page = 1) {
    // Search movies and series by year
    return fetchWithRotation("/v2.2/films", { yearFrom: year.toString(), yearTo: year.toString(), page: page.toString() })
  },

  async searchByKeyword(keyword: string, page = 1) {
    return fetchWithRotation("/v2.1/films/search-by-keyword", { keyword, page: page.toString() })
  },

  async getDetails(kinopoiskId: number) {
    return fetchWithRotation(`/v2.2/films/${kinopoiskId}`)
  },

  async importContentToDb(kinopoiskId: number) {
    const data = await this.getDetails(kinopoiskId)
    if (!data) return null; // 404 or something

    // Check if the movie is in the blacklist
    const isBlacklisted = await prisma.blacklist.findUnique({
      where: { kinopoiskId: data.kinopoiskId }
    })
    if (isBlacklisted) {
      throw new Error(`Отклонено фильтром: Проект находится в черном списке (удален ранее)`)
    }

    // ANTI-GARBAGE FILTER
    const badTypes = ['VIDEO', 'TV_SHOW']
    if (badTypes.includes(data.type)) {
      throw new Error(`Отклонено фильтром: Неподдерживаемый тип контента (${data.type})`)
    }

    const badGenres = ['концерт', 'церемония', 'ток-шоу', 'реальное тв', 'новости', 'игра']
    const hasBadGenre = (data.genres || []).some((g: any) => badGenres.includes(g.genre.toLowerCase()))
    if (hasBadGenre) {
      throw new Error(`Отклонено фильтром: Запрещенный жанр (концерт/шоу)`)
    }

    // Check if it's unreleased
    const currentYear = new Date().getFullYear()
    const releaseYear = data.year || data.startYear || 0
    if (releaseYear > currentYear) {
      throw new Error(`Отклонено фильтром: Этот контент еще не вышел (${releaseYear} год)`)
    }

    // Reject obscure movies without posters
    if (!data.posterUrl || data.posterUrl.includes('no-poster')) {
      throw new Error(`Отклонено фильтром: У контента отсутствует обложка на Кинопоиске`)
    }

    // Reject content with zero rating
    const parsedRating = parseFloat(data.rating || data.ratingKinopoisk || '0')
    if (isNaN(parsedRating) || parsedRating === 0) {
      throw new Error(`Отклонено фильтром: Нулевой рейтинг`)
    }

    // Verify video exists in Kinokino backend (fbphdplay.top)
    try {
      const balancerRes = await fetch(`https://fbphdplay.top/api/players?kinopoisk=${data.kinopoiskId}`, { 
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
      // If network timeout/error, we proceed to not block imports completely if fbphdplay goes down
      console.log("Balancer check warning:", e.message)
    }

    const isSeries = data.type === 'TV_SERIES' || data.type === 'MINI_SERIES' || data.type === 'TV_SHOW'
    
    const genres = await Promise.all(
      (data.genres || []).map(async (g: any) => {
        const slug = g.genre.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-')
        return prisma.genre.upsert({
          where: { slug },
          update: { name: g.genre },
          create: { name: g.genre, slug }
        })
      })
    )

    let trailerUrl = null // Skip fetching videos to save 50% API quota

    if (isSeries) {
      const series = await prisma.series.upsert({
        where: { kinopoiskId: data.kinopoiskId },
        update: {
          title: data.nameRu || data.nameOriginal || "",
          originalTitle: data.nameOriginal,
          description: data.description || "",
          year: data.year || data.startYear || 0,
          rating: data.ratingKinopoisk || data.ratingImdb || 0,
          posterUrl: data.posterUrl,
          backdropUrl: data.coverUrl || data.posterUrl,
        },
        create: {
          id: data.kinopoiskId.toString(),
          kinopoiskId: data.kinopoiskId,
          title: data.nameRu || data.nameOriginal || "",
          originalTitle: data.nameOriginal,
          description: data.description || "",
          year: data.year || data.startYear || 0,
          rating: data.ratingKinopoisk || data.ratingImdb || 0,
          posterUrl: data.posterUrl,
          backdropUrl: data.coverUrl || data.posterUrl,
        }
      })
      for (const genre of genres) {
        await prisma.seriesGenre.upsert({
          where: { seriesId_genreId: { seriesId: series.id, genreId: genre.id } },
          update: {},
          create: { seriesId: series.id, genreId: genre.id }
        })
      }
      return series
    } else {
      const movie = await prisma.movie.upsert({
        where: { kinopoiskId: data.kinopoiskId },
        update: {
          title: data.nameRu || data.nameOriginal || "",
          originalTitle: data.nameOriginal,
          description: data.description || "",
          year: data.year || 0,
          runtime: data.filmLength,
          rating: data.ratingKinopoisk || data.ratingImdb || 0,
          posterUrl: data.posterUrl,
          backdropUrl: data.coverUrl || data.posterUrl,
          trailerUrl: trailerUrl,
        },
        create: {
          id: data.kinopoiskId.toString(),
          kinopoiskId: data.kinopoiskId,
          title: data.nameRu || data.nameOriginal || "",
          originalTitle: data.nameOriginal,
          description: data.description || "",
          year: data.year || 0,
          runtime: data.filmLength,
          rating: data.ratingKinopoisk || data.ratingImdb || 0,
          posterUrl: data.posterUrl,
          backdropUrl: data.coverUrl || data.posterUrl,
          trailerUrl: trailerUrl,
        }
      })
      for (const genre of genres) {
        await prisma.movieGenre.upsert({
          where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
          update: {},
          create: { movieId: movie.id, genreId: genre.id }
        })
      }
      return movie
    }
  }
}
