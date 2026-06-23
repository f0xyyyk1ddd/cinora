"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Plus, Check, ThumbsUp, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface ContentCardProps {
  item: {
    id: string
    title: string
    posterUrl?: string | null
    backdropUrl?: string | null
    year?: number
    rating?: number
    type: "movie" | "series"
  }
}

// Global cache to prevent 50 simultaneous requests from all cards
let cachedFavorites: string[] | null = null
let fetchPromise: Promise<string[]> | null = null

const getFavorites = async () => {
  if (cachedFavorites) return cachedFavorites
  if (!fetchPromise) {
    fetchPromise = fetch('/api/favorites').then(res => res.json()).then(data => {
      cachedFavorites = data.favoriteIds || []
      return cachedFavorites!
    }).catch(() => [])
  }
  return fetchPromise
}

let cachedLikes: string[] | null = null
let fetchLikesPromise: Promise<string[]> | null = null

const getLikes = async () => {
  if (cachedLikes) return cachedLikes
  if (!fetchLikesPromise) {
    fetchLikesPromise = fetch('/api/ratings').then(res => res.json()).then(data => {
      cachedLikes = data.likedIds || []
      return cachedLikes!
    }).catch(() => [])
  }
  return fetchLikesPromise
}

const ScrollableTitle = ({ title }: { title: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLHeadingElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (containerRef.current && textRef.current) {
      const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
      if (diff > 0) {
        setDistance(diff);
      }
    }
  }, [title]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ maskImage: distance > 0 ? 'linear-gradient(to right, black 90%, transparent 100%)' : 'none', WebkitMaskImage: distance > 0 ? 'linear-gradient(to right, black 90%, transparent 100%)' : 'none' }}>
      <motion.div
        animate={distance > 0 ? { x: [0, -distance - 10, 0] } : {}}
        transition={{ duration: distance > 0 ? Math.max(distance / 15, 3) : 0, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
      >
        <h3 ref={textRef} className="font-bold text-white text-lg whitespace-nowrap inline-block">
          {title}
        </h3>
      </motion.div>
    </div>
  )
}

export const ContentCard = React.memo(function ContentCard({ item }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      getFavorites().then(favs => setIsFavorite(favs.includes(item.id)))
      getLikes().then(likes => setIsLiked(likes.includes(item.id)))
    }
  }, [session, item.id])

  const poster = item.posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"
  const backdrop = item.backdropUrl || poster

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session || isUpdating) return

    setIsUpdating(true)
    const prev = isFavorite
    setIsFavorite(!prev) // Optimistic update
    
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: item.id, type: item.type })
      })
      if (!res.ok) {
        setIsFavorite(prev) // Revert on failure
      } else {
        // Update cache
        if (cachedFavorites) {
          if (prev) cachedFavorites = cachedFavorites.filter(id => id !== item.id)
          else cachedFavorites.push(item.id)
        }
      }
    } catch (err) {
      setIsFavorite(prev)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session || isLiking) return

    setIsLiking(true)
    const prev = isLiked
    setIsLiked(!prev) // Optimistic update
    
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: item.id, type: item.type })
      })
      if (!res.ok) {
        setIsLiked(prev) // Revert on failure
      } else {
        // Update cache
        if (cachedLikes) {
          if (prev) cachedLikes = cachedLikes.filter(id => id !== item.id)
          else cachedLikes.push(item.id)
        }
      }
    } catch (err) {
      setIsLiked(prev)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div 
      className="relative w-full aspect-[2/3] rounded-md overflow-hidden cursor-pointer bg-[#1a1a2e]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/${item.type}/${item.id}`)}
    >
      <Image 
        src={poster} 
        alt={item.title}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
        className="object-cover transition-transform duration-300 will-change-transform"
        loading="lazy"
      />

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 glass-card flex flex-col justify-end p-4 rounded-md shadow-2xl will-change-transform"
            style={{ transformOrigin: 'bottom center' }}
          >
            <div className="absolute inset-0 z-0">
              <Image 
                src={backdrop} 
                alt={item.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                className="object-cover opacity-50 mask-image-gradient"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/80 to-transparent" />
            </div>

            <div className="relative z-10 space-y-3">
              <ScrollableTitle title={item.title} />
              
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <span className="text-green-500">{Math.round((item.rating || 0) * 10)}% Совпадение</span>
                <span>{item.year}</span>
                <span className="px-1.5 py-0.5 border border-gray-600 rounded text-[10px]">HD</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Link href={`/watch/${item.type}/${item.id}`} onClick={e => e.stopPropagation()}>
                  <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Play className="w-4 h-4 ml-1" fill="currentColor" />
                  </button>
                </Link>
                {session && (
                  <>
                    <button 
                      onClick={toggleFavorite} 
                      className="w-8 h-8 rounded-full border border-gray-400 bg-[#2a2a2a]/50 text-white flex items-center justify-center hover:border-white transition-colors"
                    >
                      {isFavorite ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={toggleLike} 
                      className={`w-8 h-8 rounded-full border bg-[#2a2a2a]/50 flex items-center justify-center transition-colors ${isLiked ? 'border-green-500 text-green-500 hover:border-green-400' : 'border-gray-400 text-white hover:border-white'}`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                  </>
                )}
                <Link href={`/${item.type}/${item.id}`} className="ml-auto" onClick={e => e.stopPropagation()}>
                  <button className="w-8 h-8 rounded-full border border-gray-400 bg-[#2a2a2a]/50 text-white flex items-center justify-center hover:border-white transition-colors">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default ContentCard
