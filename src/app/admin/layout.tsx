import Link from "next/link"
import { Film, Tv, Users, LayoutDashboard, Settings, LogOut, Download } from "lucide-react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.email) {
    redirect("/login?from=/admin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect("/login?from=/admin")
  }

  // If you strictly want only ADMIN role:
  if (user.role !== "ADMIN") {
    // Uncomment this if you want to block regular users from admin panel
    // redirect("/")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col md:flex-row text-white pt-16 md:pt-20">
      {/* Sidebar / Bottom Nav */}
      <aside className="fixed bottom-0 w-full md:w-64 bg-[#1a1a2e] border-t md:border-t-0 md:border-r border-white/5 flex md:flex-col md:h-full z-50 md:top-20">
        <div className="hidden md:block p-6 pb-2">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl font-bold text-red-600 tracking-tighter">CINE<span className="text-white">VERSE</span></span>
            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400">АДМИН</span>
          </Link>
        </div>

        <nav className="flex md:flex-col overflow-x-auto overflow-y-hidden md:overflow-visible space-x-1 md:space-x-0 md:space-y-2 p-2 md:p-6 pb-6 md:pb-6 w-full no-scrollbar">
          <Link href="/admin" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg bg-red-600/20 text-red-500 font-medium min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] md:text-base">Обзор</span>
          </Link>
          <Link href="/admin/movies" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <Film className="w-5 h-5" />
            <span className="text-[10px] md:text-base">Фильмы</span>
          </Link>
          <Link href="/admin/series" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <Tv className="w-5 h-5" />
            <span className="text-[10px] md:text-base">Сериалы</span>
          </Link>
          <Link href="/admin/tmdb" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <Download className="w-5 h-5" />
            <span className="text-[10px] md:text-base">TMDB</span>
          </Link>
          <Link href="/admin/auto-import" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] md:text-base">Парсер</span>
          </Link>
          <Link href="/admin/users" className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors min-w-[70px] md:min-w-0 flex-1 md:flex-none">
            <Users className="w-5 h-5" />
            <span className="text-[10px] md:text-base">Юзеры</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 md:p-8 md:ml-64 relative z-10 overflow-x-hidden w-full">
        {children}
      </main>
    </div>
  )
}
