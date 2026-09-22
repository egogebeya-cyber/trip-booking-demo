import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'drizzle-kit'

const dbPath = process.env.DATABASE_URL || './data/trip-booking.db'
fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
})
