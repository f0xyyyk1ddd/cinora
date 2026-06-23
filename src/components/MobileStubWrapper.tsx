"use client"

import { usePathname } from "next/navigation"
import { Toaster } from "react-hot-toast"

export default function MobileStubWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  if (isAdmin) {
    return (
      <div className="flex flex-col flex-1 w-full relative">
        {children}
        <Toaster position="bottom-right" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile Stub Screen */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0f] z-[99999]">
        <h1 className="text-3xl font-bold text-red-600 mb-4">В разработке 🚧</h1>
        <p className="text-gray-400 max-w-md">
          Извините, мобильная версия сайта на данный момент находится в стадии разработки и оптимизации. 
          <br/><br/>
          Пожалуйста, зайдите на Cinora с компьютера.
        </p>
      </div>

      {/* Desktop App */}
      <div className="hidden md:flex flex-col flex-1 w-full relative">
        {children}
        <Toaster position="bottom-right" />
      </div>
    </>
  )
}
