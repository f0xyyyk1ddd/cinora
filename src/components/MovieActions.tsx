"use client"

import { useState, useEffect } from "react"
import { Plus, Check, ThumbsUp } from "lucide-react"
import { useSession } from "next-auth/react"

interface MovieActionsProps {
  movieId: string
  type: "movie" | "series"
}

export default function MovieActions({ movieId, type }: MovieActionsProps) {
  const { data: session } = useSession()
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    if (!session) return

    // Fetch favorite status
    fetch('/api/favorites')
      .then(res => res.json())
      .then(data => {
        if (data.favoriteIds?.includes(movieId)) setIsFavorite(true)
      })
      .catch(() => {})

    // Fetch like status
    fetch('/api/ratings')
      .then(res => res.json())
      .then(data => {
        if (data.likedIds?.includes(movieId)) setIsLiked(true)
      })
      .catch(() => {})
  }, [session, movieId])

  const toggleFavorite = async () => {
    if (!session || loading) return
    setLoading(true)
    const prev = isFavorite
    setIsFavorite(!prev)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: movieId, type })
      })
      if (!res.ok) setIsFavorite(prev)
    } catch {
      setIsFavorite(prev)
    } finally {
      setLoading(false)
    }
  }

  const toggleLike = async () => {
    if (!session || likeLoading) return
    setLikeLoading(true)
    const prev = isLiked
    setIsLiked(!prev)

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: movieId, type })
      })
      if (!res.ok) setIsLiked(prev)
    } catch {
      setIsLiked(prev)
    } finally {
      setLikeLoading(false)
    }
  }

  if (!session) return null

  return (
    <>
      <button
        onClick={toggleFavorite}
        className={`w-12 h-12 rounded-full border bg-[#2a2a2a]/50 flex items-center justify-center transition-colors backdrop-blur-md ${
          isFavorite ? 'border-green-500 text-green-500 hover:border-green-400' : 'border-gray-400 text-white hover:border-white'
        }`}
      >
        {isFavorite ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
      <button
        onClick={toggleLike}
        className={`w-12 h-12 rounded-full border bg-[#2a2a2a]/50 flex items-center justify-center transition-colors backdrop-blur-md ${
          isLiked ? 'border-green-500 text-green-500 hover:border-green-400' : 'border-gray-400 text-white hover:border-white'
        }`}
      >
        <ThumbsUp className="w-6 h-6" />
      </button>
    </>
  )
}
