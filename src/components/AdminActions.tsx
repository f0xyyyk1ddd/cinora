"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminActions({ id, type, initialIsPremium }: { id: string, type: 'movies' | 'series', initialIsPremium: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPremium, setIsPremium] = useState(initialIsPremium)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить этот элемент? Он также будет добавлен в черный список, чтобы бот его больше не добавлял.")) return;
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Ошибка при удалении")
        setIsDeleting(false)
      }
    } catch (e) {
      alert("Ошибка при удалении")
      setIsDeleting(false)
    }
  }

  const togglePremium = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPremium: !isPremium })
      })
      if (res.ok) {
        setIsPremium(!isPremium)
        router.refresh()
      } else {
        alert("Ошибка при обновлении")
      }
    } catch (e) {
      alert("Ошибка при обновлении")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex space-x-2">
      <button 
        onClick={togglePremium}
        disabled={isUpdating}
        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${isPremium ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
      >
        {isPremium ? '★ Premium' : 'Free'}
      </button>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="px-3 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isDeleting ? 'Удаление...' : 'Удалить'}
      </button>
    </div>
  )
}
