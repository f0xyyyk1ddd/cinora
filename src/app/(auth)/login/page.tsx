"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "react-hot-toast"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("from") || "/profile"
  
  const [data, setData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await signIn("credentials", {
      ...data,
      redirect: false,
    })

    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success("Успешный вход!")
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const loginWithGoogle = () => {
    signIn("google", { callbackUrl })
  }

  return (
    <>
      <form onSubmit={loginUser} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Адрес электронной почты
          </label>
          <input
            type="email"
            required
            className="w-full rounded-lg bg-black/50 border border-gray-700 p-3 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Пароль
          </label>
          <input
            type="password"
            required
            className="w-full rounded-lg bg-black/50 border border-gray-700 p-3 text-white focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
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
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center space-x-4">
        <div className="h-px bg-white/20 w-full" />
        <span className="text-gray-500 text-sm whitespace-nowrap">Или продолжить через</span>
        <div className="h-px bg-white/20 w-full" />
      </div>

      <button
        onClick={loginWithGoogle}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg bg-white p-3 font-semibold text-black transition-colors hover:bg-gray-200"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>

      <p className="mt-8 text-center text-gray-400">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-white hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a2e]/80 p-8 shadow-2xl backdrop-blur-xl border border-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to CINORA</p>
        </div>
        <Suspense fallback={<div className="text-white text-center py-4">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
