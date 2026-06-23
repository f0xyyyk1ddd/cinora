"use client"

import { useState } from "react"
import { User, Settings, Clock, Heart, LogOut, List, CreditCard, Shield, ChevronRight, Trash2 } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"

interface ProfileClientProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
    createdAt?: string
  }
  favorites: any[]
  watchHistory: any[]
  likedCount: number
}

type Tab = "profile" | "favorites" | "history" | "settings"

export default function ProfileClient({ user, favorites, watchHistory, likedCount }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [removingFav, setRemovingFav] = useState<string | null>(null)
  const [favList, setFavList] = useState(favorites)
  const [historyList, setHistoryList] = useState(watchHistory)

  const handleRemoveFavorite = async (contentId: string, type: string) => {
    setRemovingFav(contentId)
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, type })
      })
      setFavList(prev => prev.filter(f => f.id !== contentId))
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingFav(null)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Профиль", icon: <User className="w-5 h-5" /> },
    { id: "favorites", label: "Мой список", icon: <List className="w-5 h-5" /> },
    { id: "history", label: "История", icon: <Clock className="w-5 h-5" /> },
    { id: "settings", label: "Настройки", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-red-600/20 text-red-500 border border-red-500/50"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-600/10 hover:text-red-300 transition-colors mt-4"
        >
          <LogOut className="w-5 h-5" />
          Выйти
        </button>
      </div>

      {/* Content Area */}
      <div className="md:col-span-3 space-y-6">
        {/* ========= PROFILE TAB ========= */}
        {activeTab === "profile" && (
          <>
            <div className="glass-card rounded-xl p-8 border border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shrink-0">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{user.name}</h3>
                  <p className="text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.role === "ADMIN" && <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 text-xs font-medium mr-2">Админ</span>}
                    Участник с {user.createdAt ? new Date(user.createdAt).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : "недавно"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-5 border border-white/5 text-center">
                <p className="text-3xl font-bold text-white">{favList.length}</p>
                <p className="text-sm text-gray-400 mt-1">В избранном</p>
              </div>
              <div className="glass-card rounded-xl p-5 border border-white/5 text-center">
                <p className="text-3xl font-bold text-white">{historyList.length}</p>
                <p className="text-sm text-gray-400 mt-1">Просмотрено</p>
              </div>
              <div className="glass-card rounded-xl p-5 border border-white/5 text-center">
                <p className="text-3xl font-bold text-white">{likedCount}</p>
                <p className="text-sm text-gray-400 mt-1">Лайков</p>
              </div>
            </div>

            {/* Plan Details */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  Детали подписки
                </h2>
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium border border-green-500/20">
                  Активна
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#1a1a2e] border border-white/5">
                <div>
                  <h3 className="text-white font-bold mb-1">CINORA Премиум</h3>
                  <p className="text-sm text-gray-400">Безлимитный доступ ко всему контенту</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========= FAVORITES TAB ========= */}
        {activeTab === "favorites" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Мой список ({favList.length})
            </h2>
            {favList.length === 0 ? (
              <div className="glass-card rounded-xl p-12 border border-white/5 text-center">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Ваш список пуст</p>
                <p className="text-gray-500 text-sm mt-2">Добавляйте фильмы и сериалы нажатием на ➕ на карточке</p>
                <Link href="/movies" className="inline-block mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Перейти к каталогу
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favList.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden bg-[#1a1a2e]">
                    <Link href={`/${item.type}/${item.id}`}>
                      <div className="aspect-[2/3] relative">
                        <Image
                          src={item.posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium truncate">{item.title}</p>
                          <p className="text-gray-300 text-xs">{item.year}</p>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemoveFavorite(item.id, item.type)}
                      disabled={removingFav === item.id}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-red-500 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========= HISTORY TAB ========= */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              История просмотров ({historyList.length})
            </h2>
            {historyList.length === 0 ? (
              <div className="glass-card rounded-xl p-12 border border-white/5 text-center">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Вы ещё ничего не смотрели</p>
                <Link href="/movies" className="inline-block mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Начать просмотр
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <Link key={item.id} href={`/${item.type}/${item.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a2e]/50 border border-white/5 hover:border-white/10 hover:bg-[#1a1a2e] transition-all cursor-pointer">
                      <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 relative">
                        <Image
                          src={item.posterUrl || "https://via.placeholder.com/500x750?text=No+Poster"}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.year} • {item.type === "movie" ? "Фильм" : "Сериал"}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Просмотрено: {new Date(item.lastWatched).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========= SETTINGS TAB ========= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Security */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-red-500" />
                Безопасность
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                  <div>
                    <h3 className="text-white font-medium">Изменить пароль</h3>
                    <p className="text-sm text-gray-400">Обновите ваш пароль</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-6 border border-red-500/20">
              <h2 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5" />
                Опасная зона
              </h2>
              <div className="p-4 rounded-xl bg-red-600/5 border border-red-500/10">
                <h3 className="text-white font-medium mb-1">Выйти из аккаунта</h3>
                <p className="text-sm text-gray-400 mb-4">Вы будете перенаправлены на страницу входа</p>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
