import { NextResponse } from "next/server"

export async function GET() {
  const results: any = {}
  try {
    const kinobox = await fetch('https://kinobox.tv/api/players?kinopoisk=634649', { signal: AbortSignal.timeout(5000) })
    results.kinobox = kinobox.ok ? await kinobox.json() : kinobox.status
  } catch (e: any) { results.kinobox = e.message }

  try {
    const apiKinobox = await fetch('https://api.kinobox.tv/api/players?kinopoisk=634649', { signal: AbortSignal.timeout(5000) })
    results.apiKinobox = apiKinobox.ok ? await apiKinobox.json() : apiKinobox.status
  } catch (e: any) { results.apiKinobox = e.message }

  try {
    const kodik = await fetch('https://kodikapi.com/search?token=cfcd208495d565ef66e7dff9f98764da&kinopoisk_id=634649', { signal: AbortSignal.timeout(5000) })
    results.kodik = kodik.ok ? await kodik.json() : kodik.status
  } catch (e: any) { results.kodik = e.message }

  try {
    const collaps = await fetch('https://api.bhcesh.me/api/short?api_token=test&kinopoisk_id=634649', { signal: AbortSignal.timeout(5000) })
    results.collaps = collaps.ok ? await collaps.json() : collaps.status
  } catch (e: any) { results.collaps = e.message }

  return NextResponse.json(results)
}
