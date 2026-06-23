"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [data, setData] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Registration successful! Please log in.")
        router.push("/login")
      } else {
        const error = await response.text()
        toast.error(error || "Registration failed")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a2e]/80 p-8 shadow-2xl backdrop-blur-xl border border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Создать аккаунт</h1>
          <p className="text-gray-400 mb-8">Присоединяйтесь к CINORA</p>
        </div>

        <form onSubmit={registerUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Полное имя</label>
            <input
              type="text"
              required
              className="w-full rounded-lg bg-black/50 border border-gray-700 p-3 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Адрес электронной почты</label>
            <input
              type="email"
              required
              className="w-full bg-[#1a1a2e] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Пароль</label>
            <input
              type="password"
              required
              className="w-full bg-[#1a1a2e] border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-white hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
