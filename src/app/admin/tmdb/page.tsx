"use client"

import { useState } from "react"
import { Search, Download, Check, Loader2, Film, Tv } from "lucide-react"
import { toast } from "react-hot-toast"

export default function TMDBImportPage() {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<"movie" | "series">("movie")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<number | null>(null)
  const [imported, setImported] = useState<number[]>([])

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tmdb/search?q=${encodeURIComponent(query)}&type=${type}`)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to search TMDB")
      }
      const data = await res.json()
      setResults(data.results || [])
    } catch (error: any) {
      if (error.message.includes("Unauthorized") || error.message.includes("mock-tmdb-api-key")) {
        toast.error("Invalid TMDB API Key. Please add a valid key to your .env file.")
      } else {
        toast.error(error.message || "Failed to search TMDB")
      }
    } finally {
      setLoading(false)
    }
  }

  const importMovie = async (tmdbId: number) => {
    setImporting(tmdbId)
    try {
      const res = await fetch("/api/admin/tmdb/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, type }),
      })

      if (res.ok) {
        toast.success(`Successfully imported ${type}`)
        setImported(prev => [...prev, tmdbId])
      } else {
        const err = await res.text()
        toast.error(`Failed to import: ${err}`)
      }
    } catch (error) {
      toast.error("An error occurred during import")
    } finally {
      setImporting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Импорт из TMDB</h1>
          <p className="text-gray-400">Поиск и импорт фильмов и сериалов из The Movie Database.</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl mb-8 border border-white/5">
        <form onSubmit={search} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={type === "movie" ? "Поиск фильмов..." : "Поиск сериалов..."}
              className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as "movie" | "series")}
            className="bg-[#1a1a2e] border border-white/10 rounded-xl px-6 text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="movie">Фильмы</option>
            <option value="series">Сериалы</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Искать"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {results.map((item) => {
          const isImported = imported.includes(item.id)
          const isImporting = importing === item.id

          return (
            <div key={item.id} className="glass-card rounded-lg overflow-hidden group">
              <div className="relative aspect-[2/3]">
                <img 
                  src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "https://via.placeholder.com/500x750"} 
                  alt={item.title || item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => importMovie(item.id)}
                    disabled={isImported || isImporting}
                    className={`p-3 rounded-full ${
                      isImported ? "bg-green-500" : "bg-red-600 hover:bg-red-700"
                    } text-white transition-colors`}
                  >
                    {isImported ? (
                      <Check className="w-6 h-6" />
                    ) : isImporting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Download className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-white truncate" title={item.title}>
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {item.release_date ? new Date(item.release_date).getFullYear() : "N/A"}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
