const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVideoExists(kinopoiskId) {
  try {
    const res = await fetch(`https://fbphdplay.top/api/players?kinopoisk=${kinopoiskId}`, { 
      signal: AbortSignal.timeout(5000),
      headers: {
        'Referer': 'https://cinora.ru/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!res.ok) return true; // Safe fallback
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) return false;
    return json.data.some(p => p.iframeUrl !== null);
  } catch (e) {
    return true; // Safe fallback
  }
}

async function main() {
  console.log("Starting full database cleanup...");
  const currentYear = new Date().getFullYear();
  const badGenres = ['концерт', 'церемония', 'ток-шоу', 'реальное тв', 'новости', 'игра'];
  const badTitles = ['У края бездны', 'Попкульт', 'Герои Энвелла', 'Шаранутый космос', 'Космос'];

  const movies = await prisma.movie.findMany({
    include: { genres: { include: { genre: true } } }
  });
  const series = await prisma.series.findMany({
    include: { genres: { include: { genre: true } } }
  });

  console.log(`Found ${movies.length} movies and ${series.length} series to check.`);

  async function processItems(items, isMovie) {
    let deleted = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (i % 50 === 0) console.log(`Processing ${isMovie ? 'movies' : 'series'}... ${i}/${items.length} (Deleted: ${deleted})`);

      const isUnreleased = item.year > currentYear;
      const hasBadGenre = item.genres.some(g => badGenres.includes(g.genre.name.toLowerCase()));
      const hasNoPoster = !item.posterUrl || item.posterUrl.includes('no-poster');
      const isBadTitle = badTitles.some(t => item.title.toLowerCase().includes(t.toLowerCase()));
      const isZeroRating = !item.rating || item.rating === 0;
      
      let shouldDelete = isUnreleased || hasBadGenre || hasNoPoster || isBadTitle || isZeroRating;
      let reason = shouldDelete ? "Metadata filters" : "";

      if (!shouldDelete) {
        const hasVideo = await checkVideoExists(item.kinopoiskId.toString());
        if (!hasVideo) {
          shouldDelete = true;
          reason = "No video found on balancer";
        }
      }

      if (shouldDelete) {
        console.log(`Deleting ${isMovie ? 'Movie' : 'Series'}: ${item.title} (ID: ${item.kinopoiskId}) - Reason: ${reason}`);
        if (isMovie) {
          await prisma.movieGenre.deleteMany({ where: { movieId: item.id } });
          await prisma.movie.delete({ where: { id: item.id } });
        } else {
          await prisma.seriesGenre.deleteMany({ where: { seriesId: item.id } });
          await prisma.series.delete({ where: { id: item.id } });
        }
        deleted++;
        
        if (item.kinopoiskId) {
          await prisma.blacklist.upsert({
            where: { kinopoiskId: item.kinopoiskId },
            update: {},
            create: { kinopoiskId: item.kinopoiskId }
          });
        }
      }
      
      // small delay to avoid hitting balancer rate limits too hard
      await new Promise(r => setTimeout(r, 100));
    }
    return deleted;
  }

  const deletedMovies = await processItems(movies, true);
  const deletedSeries = await processItems(series, false);

  console.log(`Cleanup complete! Deleted ${deletedMovies} movies and ${deletedSeries} series.`);
  process.exit(0);
}

main().catch(console.error);
