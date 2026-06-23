import fs from "fs"
import path from "path"
import prisma from "./db"
import { kinopoisk } from "./kinopoisk"

export interface MassParserState {
  currentYear: number
  currentPage: number
  status: "idle" | "running" | "waiting_quota" | "completed" | "error"
  lastRun: string | null
  importedCount: number
  totalImported: number
  error: string | null
  logs: string[]
}

function getStateFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db"
  if (dbUrl.startsWith("file:")) {
    const relativeDbPath = dbUrl.substring(5)
    const dbDir = path.dirname(path.resolve(relativeDbPath))
    return path.join(dbDir, "mass-import-state.json")
  }
  return path.resolve("./mass-import-state.json")
}

export function getMassParserState(): MassParserState {
  const filePath = getStateFilePath()
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"))
    } catch (e) {
      console.error("Error reading mass parser state", e)
    }
  }
  return {
    currentYear: 1971,
    currentPage: 1,
    status: "idle",
    lastRun: null,
    importedCount: 0,
    totalImported: 0,
    error: null,
    logs: []
  }
}

function saveState(state: MassParserState) {
  const filePath = getStateFilePath()
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to write mass parser state", e)
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function runMassParser(force = false) {
  const state = getMassParserState()

  if (force) {
    state.currentYear = 1971
    state.currentPage = 1
    state.status = "idle"
    state.importedCount = 0
    state.totalImported = 0
  }

  if (state.status === "running") {
    console.log("[MASS_PARSER] Already running. Skipping.")
    return
  }

  const currentYearDate = new Date().getFullYear()

  if (state.currentYear > currentYearDate) {
    state.status = "completed"
    saveState(state)
    return
  }

  state.status = "running"
  state.lastRun = new Date().toISOString()
  state.importedCount = 0
  state.error = null
  state.logs = [`[${new Date().toISOString()}] Started global parsing. Resuming from Year: ${state.currentYear}, Page: ${state.currentPage}`]
  saveState(state)

  const addLog = (msg: string) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`
    console.log(formatted)
    state.logs.push(formatted)
    if (state.logs.length > 50) state.logs.shift() // Keep last 50
    saveState(state)
  }

  try {
    let quotaExceeded = false

    while (state.currentYear <= currentYearDate && !quotaExceeded) {
      addLog(`Fetching list for Year: ${state.currentYear}, Page: ${state.currentPage}...`)
      
      let searchData;
      try {
        searchData = await kinopoisk.searchByYear(state.currentYear, state.currentPage)
      } catch (err: any) {
        if (err.message === "QUOTA_EXCEEDED") {
          quotaExceeded = true
          break
        }
        throw err
      }

      if (!searchData || !searchData.items || searchData.items.length === 0) {
        addLog(`No more items for year ${state.currentYear}. Moving to next year.`)
        state.currentYear++
        state.currentPage = 1
        saveState(state)
        continue
      }

      const totalPages = searchData.totalPages || 1
      const items = searchData.items as any[]
      
      // Filter out existing
      const kinopoiskIds = items.map(i => i.kinopoiskId).filter(Boolean)
      
      const existingMovies = await prisma.movie.findMany({
        where: { kinopoiskId: { in: kinopoiskIds } },
        select: { kinopoiskId: true }
      })
      const existingSeries = await prisma.series.findMany({
        where: { kinopoiskId: { in: kinopoiskIds } },
        select: { kinopoiskId: true }
      })
      const existingIds = new Set([
        ...existingMovies.map(m => m.kinopoiskId),
        ...existingSeries.map(s => s.kinopoiskId)
      ])

      const idsToFetch = kinopoiskIds.filter(id => !existingIds.has(id))
      addLog(`Page ${state.currentPage}/${totalPages} has ${idsToFetch.length} new items to import.`)

      for (const id of idsToFetch) {
        try {
          const content = await kinopoisk.importContentToDb(id)
          if (content) {
            state.importedCount++
            state.totalImported++
            addLog(`Successfully imported ID ${id} ("${content.title}")`)
          }
          await delay(300)
        } catch (err: any) {
          if (err.message === "QUOTA_EXCEEDED") {
            addLog("Kinopoisk API QUOTA EXCEEDED during details fetch.")
            quotaExceeded = true
            break
          }
          addLog(`Failed to import ID ${id}: ${err.message}`)
        }
      }

      if (quotaExceeded) break

      if (state.currentPage >= totalPages) {
        addLog(`Completed year ${state.currentYear}.`)
        state.currentYear++
        state.currentPage = 1
      } else {
        state.currentPage++
      }

      saveState(state)
    }

    if (quotaExceeded) {
      state.status = "waiting_quota"
      addLog("Global parser paused. Waiting for quota reset (next day or new keys).")
    } else if (state.currentYear > currentYearDate) {
      state.status = "completed"
      addLog("Global parser has completely finished all years up to current!")
    } else {
      state.status = "idle" // Stopped manually or something
    }

  } catch (err: any) {
    addLog(`CRITICAL ERROR: ${err.message}`)
    state.status = "error"
    state.error = err.message
  }

  saveState(state)
}
