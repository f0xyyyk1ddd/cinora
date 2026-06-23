"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Search, Bell, User, LogOut, Settings, Film } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Navbar() {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "glass" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 md:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="CINORA Logo" className="h-8 w-auto" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
            <Link href="/" className="hover:text-white transition-colors">Главная</Link>
            <Link href="/movies" className="hover:text-white transition-colors">Фильмы</Link>
            <Link href="/series" className="hover:text-white transition-colors">Сериалы</Link>
            <Link href="/favorites" className="hover:text-white transition-colors">Мой список</Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/search" className="text-gray-300 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </Link>
          
          {session && (
            <button className="text-gray-300 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          )}

          {session ? (
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-white/20">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    session.user?.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-md glass-card py-2 shadow-xl border border-white/10"
                  >
                    <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10 mb-2">
                      {session.user?.email}
                    </div>
                    
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors">
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    
                    {(session.user as any)?.role === 'ADMIN' && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition-colors">
                        <Film className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-1.5 rounded-md bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
