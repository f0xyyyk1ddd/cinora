"use client"

import { useState, useEffect } from "react"
import { Settings, Play, RefreshCw, AlertTriangle, CheckCircle, Clock, Plus, Download } from "lucide-react"
import { toast } from "react-hot-toast"

export default function AutoImportPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const [massStatus, setMassStatus] = useState<any>(null)
  const [massLoading, setMassLoading] = useState(false)
  const [massTriggering, setMassTriggering] = useState(false)

  const [cleanupStatus, setCleanupStatus] = useState<any>(null)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [cleanupTriggering, setCleanupTriggering] = useState(false)

  const [keys, setKeys] = useState<string[]>([])
  const [newKey, setNewKey] = useState("")
  const [savingKeys, setSavingKeys] = useState(false)

  const [manualId, setManualId] = useState("")
  const [manualLoading, setManualLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cron/daily-import", {
        headers: {
          "Authorization": `Bearer cinora-cron-secret-2026-xyz`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.status === "running") {
          setAutoRefresh(true)
        } else {
          setAutoRefresh(false)
        }
      }
    } catch (e) {
      console.error("Failed to fetch status", e)
    } finally {
      setLoading(false)
    }

    setMassLoading(true)
    try {
      const resMass = await fetch("/api/cron/mass-import", {
        headers: { "Authorization": `Bearer cinora-cron-secret-2026-xyz` }
      })
      if (resMass.ok) {
        setMassStatus(await resMass.json())
      }
    } catch (e) {
      console.error("Failed to fetch mass status", e)
    } finally {
      setMassLoading(false)
    }

    setCleanupLoading(true)
    try {
      const resCleanup = await fetch("/api/cron/cleanup", {
        headers: { "Authorization": `Bearer cinora-cron-secret-2026-xyz` }
      })
      if (resCleanup.ok) {
        const cleanupData = await resCleanup.json()
        setCleanupStatus(cleanupData)
        if (cleanupData.status === "running") {
          setAutoRefresh(true)
        }
      }
    } catch (e) {
      console.error("Failed to fetch cleanup status", e)
    } finally {
      setCleanupLoading(false)
    }
  }

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/admin/kinopoisk/keys")
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys || [])
      }
    } catch (e) {
      console.error("Failed to fetch keys", e)
    }
  }

  useEffect(() => {
    fetchStatus()
    fetchKeys()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchStatus()
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  const triggerImport = async () => {
    if (!confirm("Вы уверены, что хотите запустить ежедневный импорт принудительно?")) return
    
    setTriggering(true)
    try {
      const res = await fetch("/api/cron/daily-import?force=true", {
        method: "POST",
        headers: {
          "Authorization": `Bearer cinora-cron-secret-2026-xyz`
        }
      })
      if (res.ok) {
        fetchStatus()
      } else {
        alert("Ошибка при запуске импорта.")
      }
    } catch (e) {
      console.error("Failed to trigger", e)
      alert("Не удалось запустить.")
    } finally {
      setTriggering(false)
    }
  }

  const triggerMassImport = async () => {
    if (!confirm("Запустить глобальный парсинг?")) return
    
    setMassTriggering(true)
    try {
      const res = await fetch("/api/cron/mass-import?force=true", {
        method: "POST",
        headers: { "Authorization": `Bearer cinora-cron-secret-2026-xyz` }
      })
      if (res.ok) fetchStatus()
      else alert("Ошибка при запуске глобального парсинга.")
    } catch (e) {
      alert("Не удалось запустить.")
    } finally {
      setMassTriggering(false)
    }
  }

  const triggerCleanup = async () => {
    if (!confirm("Запустить очистку мусора?")) return
    
    setCleanupTriggering(true)
    try {
      const res = await fetch("/api/cron/cleanup?force=true", {
        method: "POST",
        headers: { "Authorization": `Bearer cinora-cron-secret-2026-xyz` }
      })
      if (res.ok) fetchStatus()
      else alert("Ошибка при запуске очистки.")
    } catch (e) {
      alert("Не удалось запустить.")
    } finally {
      setCleanupTriggering(false)
    }
  }

  const addKey = () => {
    if (!newKey.trim()) return
    setKeys(prev => [...prev, newKey.trim()])
    setNewKey("")
  }

  const removeKey = (index: number) => {
    setKeys(prev => prev.filter((_, i) => i !== index))
  }

  const saveKeys = async () => {
    setSavingKeys(true)
    try {
      const res = await fetch("/api/admin/kinopoisk/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      })
      if (res.ok) toast.success("Ключи сохранены")
      else toast.error("Ошибка сохранения")
    } catch (error) {
      toast.error("Произошла ошибка")
    } finally {
      setSavingKeys(false)
    }
  }

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualId.trim()) return

    setManualLoading(true)
    try {
      const res = await fetch("/api/admin/kinopoisk/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kinopoiskId: manualId }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Успешно импортировано: ${data.item.title}`)
        setManualId("")
      } else {
        const err = await res.text()
        toast.error(`Ошибка: ${err}`)
      }
    } catch (error) {
      toast.error("Произошла ошибка при импорте")
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Автоматический парсер</h1>
        <p className="text-gray-400">Настройка и мониторинг ежедневного парсинга новинок и популярных фильмов/сериалов.</p>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-500" />
              Статус системы
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Проверьте текущее состояние фоновой задачи.
            </p>
          </div>
          <button 
            onClick={fetchStatus} 
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Статус</p>
            <div className="flex items-center gap-2">
              {status?.status === "running" ? (
                <><RefreshCw className="w-4 h-4 text-blue-500 animate-spin" /><span className="font-medium text-blue-500">В процессе</span></>
              ) : status?.status === "success" ? (
                <><CheckCircle className="w-4 h-4 text-green-500" /><span className="font-medium text-green-500">Завершен успешно</span></>
              ) : status?.status === "failed" ? (
                <><AlertTriangle className="w-4 h-4 text-red-500" /><span className="font-medium text-red-500">Ошибка</span></>
              ) : (
                <><Clock className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-400">Ожидание</span></>
              )}
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Последний запуск</p>
            <p className="font-medium">
              {status?.lastRun ? new Date(status.lastRun).toLocaleString("ru-RU") : "Никогда"}
            </p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Добавлено фильмов</p>
            <p className="font-medium text-xl">
              {status?.importedCount || 0}
            </p>
          </div>
        </div>

        {status?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>{status.error}</p>
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
          <button
            onClick={triggerImport}
            disabled={triggering || status?.status === "running"}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            {triggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Запустить принудительно
          </button>
          <p className="text-xs text-gray-500">
            Этот процесс может занять несколько минут. Не закрывайте вкладку во время работы.
          </p>
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          Лог выполнения
        </h2>
        
        <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-sm h-64 overflow-y-auto space-y-2">
          {status?.logs && status.logs.length > 0 ? (
            status.logs.map((log: string, i: number) => (
              <div key={i} className="text-gray-300">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-600 italic">Нет доступных логов...</div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-6 border-t-4 border-t-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-500" />
              Глобальный парсинг всей базы
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Последовательное скачивание фильмов год за годом.
            </p>
          </div>
          <button onClick={fetchStatus} disabled={massLoading} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <RefreshCw className={`w-5 h-5 ${massLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Статус</p>
            <div className="flex items-center gap-2 font-medium">
              {massStatus?.status === "running" ? <span className="text-blue-500">Работает</span> :
               massStatus?.status === "waiting_quota" ? <span className="text-yellow-500">Ждет лимиты</span> :
               massStatus?.status === "completed" ? <span className="text-green-500">Завершен</span> :
               massStatus?.status === "error" ? <span className="text-red-500">Ошибка</span> :
               <span className="text-gray-400">Остановлен</span>}
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Текущий Год</p>
            <p className="font-medium text-xl">{massStatus?.currentYear || 1890}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Всего скачано</p>
            <p className="font-medium text-xl">{massStatus?.totalImported || 0}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
            <button
              onClick={triggerMassImport}
              disabled={massTriggering || massStatus?.status === "running"}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              Запустить
            </button>
          </div>
        </div>
        
        <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-sm h-48 overflow-y-auto space-y-2">
          {massStatus?.logs && massStatus.logs.length > 0 ? (
            massStatus.logs.map((log: string, i: number) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))
          ) : (
            <div className="text-gray-600 italic">Нет доступных логов глобального парсера...</div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-6 border-t-4 border-t-green-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Автоматическая очистка мусора
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Проверка всей базы на наличие рабочих видео-плееров (фоновая задача).
            </p>
          </div>
          <button onClick={fetchStatus} disabled={cleanupLoading} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <RefreshCw className={`w-5 h-5 ${cleanupLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Статус</p>
            <div className="flex items-center gap-2 font-medium">
              {cleanupStatus?.status === "running" ? <span className="text-blue-500">Работает</span> :
               cleanupStatus?.status === "success" ? <span className="text-green-500">Завершен</span> :
               cleanupStatus?.status === "failed" ? <span className="text-red-500">Ошибка</span> :
               <span className="text-gray-400">Ожидание</span>}
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Проверено</p>
            <p className="font-medium text-xl">{cleanupStatus?.processedCount || 0}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <p className="text-sm text-gray-400 mb-1">Удалено мусора</p>
            <p className="font-medium text-xl text-red-500">{cleanupStatus?.deletedCount || 0}</p>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
            <button
              onClick={triggerCleanup}
              disabled={cleanupTriggering || cleanupStatus?.status === "running"}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
            >
              Запустить очистку
            </button>
          </div>
        </div>
        
        <div className="bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-sm h-48 overflow-y-auto space-y-2">
          {cleanupStatus?.logs && cleanupStatus.logs.length > 0 ? (
            cleanupStatus.logs.map((log: string, i: number) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))
          ) : (
            <div className="text-gray-600 italic">Нет доступных логов очистки...</div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-yellow-500" />
            API Ключи Kinopoisk Unofficial
          </h2>
          <p className="text-sm text-gray-400">
            Добавьте больше ключей, чтобы увеличить лимит (каждый ключ дает +500 запросов в день).
          </p>
        </div>

        <div className="space-y-2 max-w-2xl">
          {keys.map((key, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input type="text" value={key} readOnly className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300" />
              <button onClick={() => removeKey(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">Удалить</button>
            </div>
          ))}
          <div className="flex gap-2 items-center pt-2">
            <input 
              type="text" 
              value={newKey} 
              onChange={e => setNewKey(e.target.value)} 
              placeholder="Новый ключ..." 
              className="flex-1 bg-black/20 border border-white/10 focus:border-yellow-500 outline-none rounded-lg px-3 py-2 text-sm" 
            />
            <button onClick={addKey} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium">Добавить</button>
          </div>
        </div>
        <button 
          onClick={saveKeys} 
          disabled={savingKeys}
          className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
        >
          {savingKeys ? "Сохранение..." : "Сохранить ключи"}
        </button>
      </div>

      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <Plus className="w-5 h-5 text-red-500" />
            Ручной импорт по ID
          </h2>
          <p className="text-sm text-gray-400">
            Введите ID фильма или сериала с Кинопоиска (например: 326), чтобы добавить его в базу немедленно.
          </p>
        </div>
        
        <form onSubmit={handleManualImport} className="flex gap-4 max-w-lg">
          <input
            type="number"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="Kinopoisk ID"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="submit"
            disabled={manualLoading || !manualId.trim()}
            className="px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {manualLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Импортировать
          </button>
        </form>
      </div>
    </div>
  )
}
