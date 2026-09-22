import fs from 'node:fs'
import path from 'node:path'

let loaded = false

export function loadServerEnv() {
  if (loaded) return
  loaded = true
  const envPath = path.join(process.cwd(), '.env')
  try {
    const text = fs.readFileSync(envPath, 'utf8')
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq <= 0) continue
      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = value
    }
  } catch {
    // .env is optional; SMTP can also be saved in admin settings
  }
}

export function env(name: string) {
  loadServerEnv()
  return process.env[name]?.trim() || ''
}
