import fs from "fs"
import path from "path"
import prisma from "./db"
import { kinopoisk } from "./kinopoisk"

export interface ImportStatus {
  lastRun: string | null
  status: "idle" | "running" | "success" | "failed"
  importedCount: number
  error: string | null
  logs: string[]
}

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
]

function getStatusFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db"
  if (dbUrl.startsWith("file:")) {
    const relativeDbPath = dbUrl.substring(5)
    const dbDir = path.dirname(path.resolve(relativeDbPath))
    return path.join(dbDir, "last-import.json")
  }
  return path.resolve("./last-import.json")
}

export function getImportStatus(): ImportStatus {
  const filePath = getStatusFilePath()
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"))
    } catch (e) {
      console.error("Error reading import status file", e)
    }
  }
  return {
    lastRun: null,
    status: "idle",
    importedCount: 0,
    error: null,
    logs: []
  }
}

function writeImportStatus(status: ImportStatus) {
  const filePath = getStatusFilePath()
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(status, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to write import status file", e)
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function runDailyImport(force = false) {
  const status = getImportStatus()
  if (status.status === "running") {
    console.log("[DAILY_IMPORT] Import is already running. Skipping execution.")
    return
  }

  const logs: string[] = []
  const lastRunTime = new Date().toISOString()
  let importedCount = 0
  let skippedCount = 0

  const writeLiveStatus = (statusType: "running" | "success" | "failed", errorMsg: string | null = null) => {
    writeImportStatus({
      lastRun: lastRunTime,
      status: statusType,
      importedCount,
      error: errorMsg,
      logs
    })
  }

  const addLog = (msg: string) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`
    console.log(formatted)
    logs.push(formatted)
    writeLiveStatus("running")
  }

  addLog("Starting Daily Import Process...")

  try {
    const targetIds = new Set<number>()

    // 1. Fetch Popular Movies (Pages 1 & 2)
    for (let page = 1; page <= 2; page++) {
      addLog(`Fetching popular collection (page ${page})...`)
      try {
        const popular = await kinopoisk.getTopPopular(page)
        if (popular && popular.items) {
          popular.items.forEach((item: any) => {
            if (item.kinopoiskId) {
              targetIds.add(item.kinopoiskId)
            }
          })
        }
      } catch (err: any) {
        addLog(`Error fetching popular page ${page}: ${err.message}`)
      }
    }

    // 2. Fetch Premieres of the Current Month
    const now = new Date()
    const year = now.getFullYear()
    const month = MONTHS[now.getMonth()]
    addLog(`Fetching premieres for ${month} ${year}...`)
    try {
      const premieres = await kinopoisk.getPremieres(year, month)
      if (premieres && premieres.items) {
        premieres.items.forEach((item: any) => {
          if (item.kinopoiskId) {
            targetIds.add(item.kinopoiskId)
          }
        })
      }
    } catch (err: any) {
      addLog(`Error fetching premieres: ${err.message}`)
    }

    // 2.5 Fetch recent movies for the current year (pages 1 to 5)
    addLog(`Fetching recent movies for ${year}...`)
    for (let page = 1; page <= 5; page++) {
      try {
        const recent = await kinopoisk.searchByYear(year, page)
        if (recent && recent.items) {
          recent.items.forEach((item: any) => {
            if (item.kinopoiskId) {
              targetIds.add(item.kinopoiskId)
            }
          })
        }
      } catch (err: any) {
        addLog(`Error fetching recent year ${year} page ${page}: ${err.message}`)
      }
    }

    addLog(`Found ${targetIds.size} potential content IDs to process.`)

    // 3. Fetch list of existing Kinopoisk IDs in database to skip duplicates and save quota
    if (!force) {
      const existingMovies = await prisma.movie.findMany({
        where: { kinopoiskId: { not: null } },
        select: { kinopoiskId: true }
      })
      const existingSeries = await prisma.series.findMany({
        where: { kinopoiskId: { not: null } },
        select: { kinopoiskId: true }
      })
      const existingIds = new Set([
        ...existingMovies.map(m => m.kinopoiskId),
        ...existingSeries.map(s => s.kinopoiskId)
      ])

      addLog(`Database already contains ${existingIds.size} items. Checking for new additions...`)

      // Filter target IDs
      for (const id of Array.from(targetIds)) {
        if (existingIds.has(id)) {
          targetIds.delete(id)
          skippedCount++
        }
      }
      addLog(`Skipped ${skippedCount} items because they already exist in the database.`)
    }

    addLog(`Proceeding to import/update ${targetIds.size} items.`)

    // 4. Import the content items
    for (const id of Array.from(targetIds)) {
      try {
        addLog(`Importing content item ID: ${id}...`)
        const content = await kinopoisk.importContentToDb(id)
        if (content) {
          importedCount++
          addLog(`Successfully imported: "${content.title}" (ID: ${content.id})`)
        } else {
          addLog(`Item ID ${id} not found on Kinopoisk.`)
        }
        
        // Wait 300ms to throttle API usage
        await delay(300)
      } catch (err: any) {
        addLog(`Failed to import item ID ${id}: ${err.message}`)
        if (err.message.includes("quota")) {
          addLog("CRITICAL: Kinopoisk API quota exceeded during operation. Stopping.")
          break
        }
      }
    }

    addLog(`Daily Import completed! Imported ${importedCount} items, skipped ${skippedCount} items.`)

    writeLiveStatus("success")
  } catch (error: any) {
    addLog(`CRITICAL ERROR during import process: ${error.message}`)
    writeLiveStatus("failed", error.message)
  }
}
