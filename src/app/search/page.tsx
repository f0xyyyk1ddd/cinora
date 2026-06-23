"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Search, Loader2 } from "lucide-react"
import ContentCard from "@/components/ContentCard"
import { useDebounce } from "@/lib/useDebounce"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{movies: any[], series: any[]}>({ movies: [], series: [] })
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({ movies: [], series: [] })
      return
    }

    const searchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    searchData()
  }, [debouncedQuery])

  const totalResults = results.movies.length + results.series.length

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="pt-32 px-4 md:px-12 min-h-[70vh]">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск фильмов и сериалов..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1a1a2e] border border-white/20 rounded-xl py-6 pl-16 pr-6 text-xl text-white focus:outline-none focus:border-red-500 shadow-2xl transition-colors"
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            {loading && (
              <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-red-500 animate-spin" />
            )}
          </div>

          {!query && (
            <div className="mt-12 text-center text-gray-500">
              Начните печатать для поиска...
            </div>
          )}
        </div>

        {query && !loading && totalResults === 0 && (
          <div className="mt-20 text-center text-gray-500 text-xl">
            По вашему запросу "{query}" ничего не найдено.
          </div>
        )}

        {results.movies.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Фильмы</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.movies.map(movie => (
                <ContentCard key={movie.id} item={{ ...movie, type: "movie" }} />
              ))}
            </div>
          </div>
        )}

        {results.series.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Сериалы</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.series.map(series => (
                <ContentCard key={series.id} item={{ ...series, type: "series" }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
