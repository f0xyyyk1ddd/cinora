import fs from "fs"
import path from "path"

const KEYS_FILE = path.join(process.cwd(), "data", "api-keys.json")

const DEFAULT_KEYS = [
  "594df5b8-fa7d-45b1-8ff0-d5df3cb8781d",
  "4d2f2f6b-7141-424b-b843-6f77e76a6f2c",
  "8c8e1a50-6322-4135-8875-5d40a5420d86",
  "22cb56ce-d65c-402a-921c-5d9c282cecb3",
  "8db714cb-f14a-46da-b0cd-2cd3b97b1bb3",
  "e18ce678-75c1-4b13-b51f-5e4860dff57d",
  "9900c3b3-855d-4fcf-8dc0-5b58ee96f432"
]

export function getKeys(): string[] {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"))
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (e) {
    console.error("Failed to read api-keys.json", e)
  }
  
  // Create file if it doesn't exist
  saveKeys(DEFAULT_KEYS)
  return DEFAULT_KEYS
}

export function saveKeys(keys: string[]) {
  try {
    const dataDir = path.dirname(KEYS_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2))
  } catch (e) {
    console.error("Failed to save api-keys.json", e)
  }
}
