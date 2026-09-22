import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { ensureDayTripSeed } from './day-trip-seed'
import { ensureInternationalTrips } from './ensure-international-trips'
import { ensureLegalPages } from './ensure-legal'
import { ensureSiteSettingsColumns } from './ensure-columns'
import { ensureSeed } from './seed'

const defaultPath = path.join(process.cwd(), 'data', 'trip-booking.db')
const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || defaultPath

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

ensureSiteSettingsColumns(sqlite)

export function ensureDbSchema() {
  ensureSiteSettingsColumns(sqlite)
}

export const db = drizzle(sqlite, { schema })

void ensureSeed()
  .then(() => ensureDayTripSeed())
  .then(() => ensureInternationalTrips())
  .then(() => ensureLegalPages())
  .then(async () => {
    const { startTripReminderScheduler } = await import('../sms/reminders')
    startTripReminderScheduler()
  })

export type Db = typeof db
