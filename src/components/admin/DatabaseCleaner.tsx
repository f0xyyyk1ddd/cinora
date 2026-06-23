"use client"

import { useState } from "react"
import { PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react"

export default function DatabaseCleaner() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState({ totalProcessed: 0, totalDeleted: 0 })
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg].slice(-10)) // Keep last 10 logs
  }

  const runCleanup = async () => {
    if (!confirm("Вы уверены, что хотите запустить полную очистку? Это может занять некоторое время.")) return;

    setIsRunning(true)
    setStatus("running")
    setProgress({ totalProcessed: 0, totalDeleted: 0 })
    setLogs([])
    addLog("Запуск проверки фильмов...")

    const BATCH_SIZE = 50

    async function processType(type: 'movies' | 'series') {
      let offset = 0
      let done = false

      while (!done) {
        try {
          const res = await fetch('/api/admin/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offset, limit: BATCH_SIZE, type })
          })

          if (!res.ok) {
            throw new Error(`Server error: ${res.status}`)
          }

          const data = await res.json()
          
          if (data.error) {
             throw new Error(data.error)
          }

          setProgress(prev => ({
            totalProcessed: prev.totalProcessed + data.processed,
            totalDeleted: prev.totalDeleted + data.deleted
          }))

          if (data.processed > 0) {
             addLog(`[${type === 'movies' ? 'Фильмы' : 'Сериалы'}] Проверено: ${offset + data.processed}, удалено в этой партии: ${data.deleted}`)
          }

          offset += data.processed
          done = data.done

          // Add a small client-side delay to give browser a breather
          await new Promise(r => setTimeout(r, 500))

        } catch (error: any) {
          addLog(`Ошибка: ${error.message}`)
          setStatus("error")
          setIsRunning(false)
          return false
        }
      }
      return true
    }

    const moviesSuccess = await processType('movies')
    if (moviesSuccess) {
      addLog("Переход к проверке сериалов...")
      const seriesSuccess = await processType('series')
      if (seriesSuccess) {
        setStatus("completed")
        addLog("Очистка успешно завершена!")
      }
    }
    
    setIsRunning(false)
  }

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Очистка базы (Битые видео)</h3>
            <p className="text-sm text-gray-400">Проверяет фильмы и сериалы на доступность плеера fbfind</p>
          </div>
        </div>
        
        <button
          onClick={runCleanup}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          {isRunning ? "Идет проверка..." : "Запустить очистку"}
        </button>
      </div>

      {(status !== "idle" || logs.length > 0) && (
        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Статус:</span>
            {status === "running" && <span className="text-blue-400 animate-pulse">В процессе...</span>}
            {status === "completed" && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Завершено</span>}
            {status === "error" && <span className="text-red-500">Ошибка</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Всего проверено</div>
              <div className="text-xl font-bold text-white">{progress.totalProcessed}</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              <div className="text-xs text-red-400/80 mb-1">Удалено нерабочих</div>
              <div className="text-xl font-bold text-red-500">{progress.totalDeleted}</div>
            </div>
          </div>

          <div className="bg-black/60 rounded-lg p-3 font-mono text-xs text-gray-400 space-y-1 mt-2">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            {logs.length === 0 && <div>Ожидание запуска...</div>}
          </div>
        </div>
      )}
    </div>
  )
}
