import { PrismaClient } from "@prisma/client"
import { kinopoisk } from "../src/lib/kinopoisk"
import { tmdb } from "../src/lib/tmdb"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting cover update from Kinopoisk...")
  const movies = await prisma.movie.findMany()

  for (const movie of movies) {
    if (!movie.posterUrl || movie.posterUrl.includes("tmdb.org")) {
      console.log(`Updating ${movie.title}...`)
      
      let kpCovers = null
      
      // We need IMDB ID, which we don't store directly, so we can fetch from TMDB by tmdbId
      try {
        if (movie.tmdbId) {
          const tmdbData = await tmdb.getMovieDetails(movie.tmdbId)
          if (tmdbData.imdb_id) {
            kpCovers = await kinopoisk.getCoverByImdbId(tmdbData.imdb_id)
          }
        }
      } catch (e) {
        console.log("TMDB fetch failed for", movie.title)
      }

      if (!kpCovers) {
        kpCovers = await kinopoisk.getCoverByTitle(movie.title, movie.year)
      }

      if (kpCovers && kpCovers.posterUrl) {
        await prisma.movie.update({
          where: { id: movie.id },
          data: {
            posterUrl: kpCovers.posterUrl,
            backdropUrl: kpCovers.backdropUrl || kpCovers.posterUrl
          }
        })
        console.log(`Success: updated ${movie.title}`)
      } else {
        console.log(`Failed to find Kinopoisk cover for ${movie.title}`)
      }
      
      // Delay to respect API limits
      await new Promise(r => setTimeout(r, 300))
    }
  }
  console.log("Finished updating covers!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
