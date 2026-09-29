import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

const db = new Database('data/trip-booking.db')
const hash = bcrypt.hashSync('admin123', 10)
const result = db
  .prepare(
    `UPDATE users
     SET password_hash = ?, email_verified = 1, role = 'admin'
     WHERE email = 'admin@tripexplorer.com'`,
  )
  .run(hash)

if (result.changes === 0) {
  const { nanoid } = await import('nanoid')
  db.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, email_verified)
     VALUES (?, 'admin@tripexplorer.com', ?, 'Site Admin', 'admin', 1)`,
  ).run(nanoid(), hash)
  console.log('created admin@tripexplorer.com')
} else {
  console.log('reset admin@tripexplorer.com')
}

const row = db
  .prepare('SELECT email, role, email_verified, password_hash FROM users WHERE email = ?')
  .get('admin@tripexplorer.com')
console.log({
  email: row.email,
  role: row.role,
  email_verified: row.email_verified,
  password_ok: bcrypt.compareSync('admin123', row.password_hash),
})
