"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

interface Genre {
  id: string
  name: string
  slug: string
}

export default function MoviesFilter({ genres, currentType = "movie" }: { genres: Genre[], currentType?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [genre, setGenre] = useState(searchParams.get("genre") || "")
  const [year, setYear] = useState(searchParams.get("year") || "")
  const [sort, setSort] = useState(searchParams.get("sort") || "rating")

  // Years options from 1970 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i)

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (genre) params.set("genre", genre)
    if (year) params.set("year", year)
    if (sort) params.set("sort", sort)
    
    // Always reset to page 1 when filtering
    params.set("page", "1")

    router.push(`${pathname}?${params.toString()}`)
  }

  // Auto-apply when state changes
  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre, year, sort])

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-4 mb-8 bg-[#1a1a2e]/50 p-4 rounded-xl border border-gray-800/50">
      <div className="w-full md:w-auto flex-1">
        <label className="block text-xs text-gray-400 mb-1 ml-1">Жанр</label>
        <select 
          value={genre} 
          onChange={e => setGenre(e.target.value)}
          className="w-full bg-[#0f0f16] border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-colors"
        >
          <option value="">Все жанры</option>
          {genres.map(g => (
            <option key={g.id} value={g.slug}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="w-full md:w-auto flex-1">
        <label className="block text-xs text-gray-400 mb-1 ml-1">Год</label>
        <select 
          value={year} 
          onChange={e => setYear(e.target.value)}
          className="w-full bg-[#0f0f16] border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-colors"
        >
          <option value="">Все годы</option>
          <option value="2024-2025">Новинки (2024-2025)</option>
          <option value="2020-2023">Свежие (2020-2023)</option>
          <option value="2010-2019">2010-е</option>
          <option value="2000-2009">2000-е</option>
          {years.map(y => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>
      </div>

      <div className="w-full md:w-auto flex-1">
        <label className="block text-xs text-gray-400 mb-1 ml-1">Сортировка</label>
        <select 
          value={sort} 
          onChange={e => setSort(e.target.value)}
          className="w-full bg-[#0f0f16] border border-gray-700 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-colors"
        >
          <option value="rating">По высокому рейтингу</option>
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="title_asc">По алфавиту (А-Я)</option>
        </select>
      </div>
      
      {/* Clear button */}
      {(genre || year || sort !== "rating") && (
        <div className="w-full md:w-auto flex items-end h-full pt-5">
          <button 
            onClick={() => {
              setGenre("")
              setYear("")
              setSort("rating")
            }}
            className="w-full md:w-auto px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700"
          >
            Сбросить
          </button>
        </div>
      )}
    </div>
  )
}
