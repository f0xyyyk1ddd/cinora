"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Info } from "lucide-react"
import Link from "next/link"

interface HeroCarouselProps {
  items: any[]
}

export default function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!items || items.length === 0) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [items])

  if (!items || items.length === 0) {
    return <div className="w-full h-[80vh] bg-gray-900 animate-pulse" />
  }

  const current = items[currentIndex]

  return (
    <div className="relative w-full h-[85vh] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/20 to-transparent" />
          
          <img 
            src={current.backdropUrl || current.posterUrl} 
            alt={current.title}
            className="w-full h-full object-cover scale-105"
          />

          <div className="absolute inset-0 z-20 flex flex-col justify-center px-4 md:px-12 w-full max-w-3xl pb-20">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {current.title}
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-200 mb-8 line-clamp-3 drop-shadow-md"
            >
              {current.description}
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4"
            >
              <Link href={`/watch/${current.type || 'movie'}/${current.id}`}>
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-white text-black font-semibold hover:bg-gray-200 transition-colors shadow-lg">
                  <Play className="w-5 h-5" fill="currentColor" />
                  Смотреть
                </button>
              </Link>
              
              <Link href={`/${current.type || 'movie'}/${current.id}`}>
                <button className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-gray-500/50 text-white font-semibold backdrop-blur-md hover:bg-gray-500/70 transition-colors shadow-lg">
                  <Info className="w-5 h-5" />
                  Подробнее
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
