import prisma from "@/lib/db"
import { Users, Film, Tv, PlayCircle } from "lucide-react"
import DatabaseCleaner from "@/components/admin/DatabaseCleaner"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminDashboard() {
  const [usersCount, moviesCount, seriesCount, sourcesCount] = await Promise.all([
    prisma.user.count(),
    prisma.movie.count(),
    prisma.series.count(),
    prisma.videoSource.count(),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Обзор панели администратора</h1>
        <p className="text-gray-400">Статистика и метрики платформы.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-500/20 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Пользователи</p>
            <p className="text-2xl font-bold text-white">{usersCount}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-red-500/20 text-red-500">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Фильмы</p>
            <p className="text-2xl font-bold text-white">{moviesCount}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-purple-500/20 text-purple-500">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Сериалы</p>
            <p className="text-2xl font-bold text-white">{seriesCount}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-green-500/20 text-green-500">
            <PlayCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">Источники видео</p>
            <p className="text-2xl font-bold text-white">{sourcesCount}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <DatabaseCleaner />
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-6 text-white">Недавние фильмы</h2>
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Название</th>
                <th className="px-6 py-4 font-medium">Год</th>
                <th className="px-6 py-4 font-medium">Рейтинг</th>
                <th className="px-6 py-4 font-medium">Дата добавления</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(await prisma.movie.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })).map(movie => (
                <tr key={movie.id}>
                  <td className="px-6 py-4 text-white">{movie.title}</td>
                  <td className="px-6 py-4 text-gray-400">{movie.year}</td>
                  <td className="px-6 py-4 text-green-500">{movie.rating.toFixed(1)}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(movie.createdAt).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
