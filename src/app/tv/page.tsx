import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import TvConnectForm from "@/components/TvConnectForm"
import Navbar from "@/components/Navbar"

export const metadata = {
  title: 'Подключение телевизора',
};

export default async function TvConnectPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login?callbackUrl=/tv')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col text-white">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-[#1a1a2e] p-8 rounded-xl max-w-md w-full border border-gray-800 shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 text-center">Вход на ТВ</h1>
          <p className="text-gray-400 text-center mb-8">
            Введите 6-значный код, который отображается на экране вашего телевизора
          </p>
          <TvConnectForm />
        </div>
      </div>
    </div>
  )
}
