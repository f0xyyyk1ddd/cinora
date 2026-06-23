import prisma from "@/lib/db"
import AdminSearch from "@/components/AdminSearch"
import AdminActions from "@/components/AdminActions"
import Link from "next/link"

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string, page?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || ""
  const page = parseInt(resolvedSearchParams.page || "1", 10)
  const pageSize = 50

  const where = query ? {
    title: { contains: query }
  } : {}

  const [movies, totalCount] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.movie.count({ where })
  ])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Управление Фильмами</h1>
      
      <AdminSearch placeholder="Поиск фильма по названию..." />

      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">ID (KP)</th>
              <th className="px-6 py-4 font-medium">Название</th>
              <th className="px-6 py-4 font-medium">Год</th>
              <th className="px-6 py-4 font-medium">Добавлен</th>
              <th className="px-6 py-4 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {movies.map(movie => (
              <tr key={movie.id} className="hover:bg-white/5">
                <td className="px-6 py-4 text-xs font-mono">{movie.kinopoiskId || movie.id.substring(0,8)}</td>
                <td className="px-6 py-4">
                  <Link href={`/watch/movie/${movie.id}`} className="hover:text-purple-400 transition-colors" target="_blank">
                    {movie.title}
                  </Link>
                </td>
                <td className="px-6 py-4">{movie.year}</td>
                <td className="px-6 py-4">{movie.createdAt.toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <AdminActions id={movie.id} type="movies" initialIsPremium={movie.isPremium} />
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {query ? "По вашему запросу ничего не найдено." : "Фильмов пока нет."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {page > 1 && (
            <Link 
              href={`?q=${query}&page=${page - 1}`}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              Назад
            </Link>
          )}
          <span className="px-4 py-2 text-gray-400">Страница {page} из {totalPages}</span>
          {page < totalPages && (
            <Link 
              href={`?q=${query}&page=${page + 1}`}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              Вперед
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
