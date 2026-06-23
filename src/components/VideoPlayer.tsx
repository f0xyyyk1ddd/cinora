"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowLeft, MonitorPlay, Settings, Maximize, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface VideoPlayerProps {
  content: {
    id: string
    tmdbId?: number | null
    title: string
    type: string
  }
  sources: any[]
}


export default function VideoPlayer({ content, sources }: VideoPlayerProps) {
  const router = useRouter()
  const [activeSourceIndex, setActiveSourceIndex] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showSourceSelector, setShowSourceSelector] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const activeSource = sources[activeSourceIndex]

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        if (!showSourceSelector) setShowControls(false)
      }, 3000)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [showSourceSelector])

  // Record watch history when the player opens
  useEffect(() => {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieId: content.type === 'movie' ? content.id : undefined,
        seriesId: content.type === 'series' ? content.id : undefined
      })
    }).catch(err => console.error("Failed to record history", err))
  }, [content.id, content.type])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center"
    >
      {activeSource ? (
        <div className="w-full h-full bg-black relative overflow-hidden">
          <iframe
            key={activeSource.embedUrl}
            src={activeSource.embedUrl}
            className="w-full border-0 h-[200vh] -mt-[50vh] md:h-[calc(100%+330px)] md:-mt-[330px]"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="text-white">Нет доступных источников видео.</div>
      )}

      {/* Top Controls Overlay */}
      <div 
        className={`absolute top-0 left-0 right-0 z-10 pointer-events-none transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors backdrop-blur-md pointer-events-auto"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-white font-semibold text-lg pointer-events-auto">{content.title}</h2>
        </div>
      </div>

      {/* Bottom Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 pointer-events-none transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Player controls would go here if not iframe based */}
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowSourceSelector(!showSourceSelector)}
              className="p-2 rounded-lg bg-black/50 hover:bg-white/20 text-white transition-colors backdrop-blur-md flex items-center gap-2 pointer-events-auto"
            >
              <MonitorPlay className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:block">Источники</span>
            </button>

            {showSourceSelector && (
              <div className="absolute bottom-full right-0 mb-4 w-auto min-w-[300px] bg-[#0a0a0f] p-4 rounded-xl border border-white/10 shadow-2xl pointer-events-auto max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                    <MonitorPlay className="w-5 h-5" /> Источники видео
                  </h3>
                  {sources.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {sources.map((s, idx) => (
                        <button 
                          key={s.id || idx}
                          onClick={() => {
                            if (activeSourceIndex !== idx) {
                              setActiveSourceIndex(idx)
                            }
                            setShowSourceSelector(false)
                          }}
                          className={`px-4 py-3 text-left rounded-lg transition-colors border ${activeSourceIndex === idx ? 'bg-red-600/20 border-red-500 text-white' : 'bg-[#1a1a2e] border-white/5 hover:border-white/20 text-gray-300'}`}
                        >
                          {s.provider} <span className="text-xs text-gray-500 block">{s.title || `Сервер ${idx + 1}`}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Нет доступных источников видео.</p>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-black/50 hover:bg-white/20 text-white transition-colors backdrop-blur-md pointer-events-auto"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
