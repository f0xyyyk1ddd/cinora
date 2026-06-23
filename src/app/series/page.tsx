import prisma from "@/lib/db"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ContentCard from "@/components/ContentCard"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default async function SeriesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams
  const page = parseInt(resolvedParams.page || "1")
  const take = 30
  const skip = (page - 1) * take

  const [series, totalCount] = await Promise.all([
    prisma.series.findMany({
      orderBy: { rating: 'desc' },
      take,
      skip
    }),
    prisma.series.count()
  ])

  const totalPages = Math.ceil(totalCount / take)

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      
      <div className="pt-24 px-4 md:px-12 pb-20">
        <h1 className="text-3xl font-bold text-white mb-8">Сериалы</h1>
        
        {series.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
              {series.map(s => (
                <ContentCard key={s.id} item={{ ...s, type: "series" }} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link href={`/series?page=${page - 1}`} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] rounded-lg text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                    Назад
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e]/50 text-gray-500 rounded-lg cursor-not-allowed">
                    <ChevronLeft className="w-5 h-5" />
                    Назад
                  </div>
                )}
                
                <span className="text-gray-400">
                  Страница <span className="text-white font-medium">{page}</span> из {totalPages}
                </span>

                {page < totalPages ? (
                  <Link href={`/series?page=${page + 1}`} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] hover:bg-[#2a2a3e] rounded-lg text-white transition-colors">
                    Вперед
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e]/50 text-gray-500 rounded-lg cursor-not-allowed">
                    Вперед
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Сериалы не найдены.
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
