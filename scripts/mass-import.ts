import { PrismaClient } from "@prisma/client"
import { kinopoisk } from "../src/lib/kinopoisk"

const prisma = new PrismaClient()

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchFromKinopoisk() {
  console.log("Starting Mass Import from Kinopoisk Unofficial API...")
  
  // We want to fetch 100 pages of TOP_POPULAR_ALL (2000 items)
  for (let page = 26; page <= 125; page++) {
    console.log(`\nFetching Page ${page} from Kinopoisk...`)
    try {
      const data = await kinopoisk.getTopPopular(page)
      
      if (!data.items || data.items.length === 0) {
        console.log("No more items found.")
        break
      }

      for (const item of data.items) {
        try {
          const type = item.type === 'TV_SERIES' || item.type === 'MINI_SERIES' || item.type === 'TV_SHOW' ? 'SERIES' : 'MOVIE'
          console.log(`[${type}] Importing: ${item.nameRu || item.nameOriginal}`)
          
          await kinopoisk.importContentToDb(item.kinopoiskId)
          
          // Wait to prevent rapid-fire API ban
          await delay(200)
        } catch (err: any) {
          console.error(`Failed to import ${item.kinopoiskId}:`, err.message)
        }
      }
    } catch (error: any) {
      console.error(`Failed to fetch page ${page}:`, error.message)
      if (error.message.includes("quota")) {
        console.error("CRITICAL: ALL API KEYS QUOTA EXCEEDED! Stopping import.")
        break
      }
    }
  }

  console.log("\nMass import completed!")
}

fetchFromKinopoisk()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
