"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ContentCard from "./ContentCard"

interface ContentRowProps {
  title: string
  items: any[]
}

export default function ContentRow({ title, items }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isMoved, setIsMoved] = useState(false)

  const handleClick = (direction: "left" | "right") => {
    setIsMoved(true)
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
    }
  }

  if (!items || items.length === 0) return null

  return (
    <div className="space-y-2 md:space-y-4 py-4 px-4 md:px-12 relative z-20 group">
      <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
        {title}
      </h2>
      
      <div className="group relative md:-ml-2">
        <button 
          onClick={() => handleClick("left")}
          className={`absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 flex items-center justify-center bg-black/50 rounded-full border border-white/20 backdrop-blur-md ${!isMoved && "hidden"}`}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div 
          ref={rowRef}
          className="flex items-center space-x-2.5 overflow-x-scroll hide-scrollbar md:space-x-4 md:p-2"
        >
          {items.map((item) => (
            <div key={item.id} className="w-[150px] md:w-[200px] flex-shrink-0">
              <ContentCard item={{...item, type: item.type || "movie"}} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => handleClick("right")}
          className="absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 flex items-center justify-center bg-black/50 rounded-full border border-white/20 backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}
