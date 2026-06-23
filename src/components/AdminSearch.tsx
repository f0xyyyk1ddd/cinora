"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, FormEvent } from "react"

export default function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`?q=${encodeURIComponent(query.trim())}&page=1`)
    } else {
      router.push(`?page=1`)
    }
  }

  const handleClear = () => {
    setQuery('')
    router.push(`?page=1`)
  }

  return (
    <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
      />
      <button 
        type="submit"
        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
      >
        Найти
      </button>
      {searchParams.get('q') && (
        <button 
          type="button"
          onClick={handleClear}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
        >
          Сброс
        </button>
      )}
    </form>
  )
}
