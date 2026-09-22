import type Database from 'better-sqlite3'

const SITE_SETTINGS_COLUMNS: { name: string; ddl: string }[] = [
  { name: 'facebook_url', ddl: 'text' },
  { name: 'instagram_url', ddl: 'text' },
  { name: 'tiktok_url', ddl: 'text' },
  { name: 'whatsapp_number', ddl: "text default '251911000000'" },
  { name: 'telegram_username', ddl: "text default 'TripExplorerSupport'" },
  { name: 'about_text', ddl: 'text' },
  { name: 'hero_title', ddl: "text default 'Discover Amazing Trips'" },
  { name: 'hero_subtitle', ddl: "text default 'Book unforgettable adventures across Ethiopia and beyond'" },
  { name: 'hero_video_url', ddl: 'text' },
  { name: 'telebirr_number', ddl: 'text' },
  { name: 'bank_name', ddl: 'text' },
  { name: 'bank_account', ddl: 'text' },
  { name: 'analytics_id', ddl: 'text' },
  { name: 'default_deposit_percent', ddl: 'integer not null default 30' },
  { name: 'group_discount_small_min_guests', ddl: 'integer not null default 5' },
  { name: 'group_discount_small_percent', ddl: 'integer not null default 5' },
  { name: 'group_discount_min_guests', ddl: 'integer not null default 10' },
  { name: 'group_discount_percent', ddl: 'integer not null default 10' },
  { name: 'homepage_json', ddl: 'text' },
]

function addMissingColumns(
  sqlite: Database.Database,
  table: string,
  columns: { name: string; ddl: string }[],
) {
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
  if (!tables) return

  const existing = new Set(
    (sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name),
  )

  for (const column of columns) {
    if (existing.has(column.name)) continue
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column.name} ${column.ddl}`)
  }
}

export function ensureSiteSettingsColumns(sqlite: Database.Database) {
  addMissingColumns(sqlite, 'site_settings', SITE_SETTINGS_COLUMNS)
  addMissingColumns(sqlite, 'blog_posts', [{ name: 'video_url', ddl: 'text' }])
  addMissingColumns(sqlite, 'bookings', [{ name: 'payment_proof_url', ddl: 'text' }])
  addMissingColumns(sqlite, 'site_settings', [
    { name: 'telebirr_qr_url', ddl: 'text' },
    { name: 'bank_qr_url', ddl: 'text' },
    { name: 'smtp_host', ddl: 'text' },
    { name: 'smtp_port', ddl: 'integer default 587' },
    { name: 'smtp_user', ddl: 'text' },
    { name: 'smtp_pass', ddl: 'text' },
    { name: 'smtp_from', ddl: 'text' },
    { name: 'telegram_bot_token', ddl: 'text' },
    { name: 'telegram_bot_username', ddl: 'text' },
    { name: 'telegram_update_offset', ddl: 'integer not null default 0' },
  ])
  addMissingColumns(sqlite, 'users', [
    { name: 'email_verified', ddl: 'integer not null default 1' },
    { name: 'email_verify_code_hash', ddl: 'text' },
    { name: 'email_verify_expires_at', ddl: 'integer' },
  ])
  addMissingColumns(sqlite, 'trips', [
    { name: 'offers_private_package', ddl: 'integer not null default 1' },
    { name: 'offers_family_trip', ddl: 'integer not null default 1' },
    { name: 'private_package_guests', ddl: 'integer not null default 15' },
    { name: 'private_package_price', ddl: 'integer' },
    { name: 'family_max_guests', ddl: 'integer not null default 8' },
  ])
  addMissingColumns(sqlite, 'bookings', [{ name: 'party_type', ddl: "text not null default 'shared'" }])
  addMissingColumns(sqlite, 'site_settings', [
    { name: 'private_package_guests', ddl: 'integer not null default 15' },
    { name: 'family_max_guests', ddl: 'integer not null default 8' },
    { name: 'sms_enabled', ddl: 'integer not null default 0' },
    { name: 'sms_api_token', ddl: 'text' },
    { name: 'sms_sender_name', ddl: 'text' },
    { name: 'sms_identifier', ddl: 'text' },
  ])
  addMissingColumns(sqlite, 'bookings', [{ name: 'reminder_sent_at', ddl: 'integer' }])
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chat_conversations (
      id text PRIMARY KEY,
      visitor_name text,
      visitor_email text,
      user_id text,
      status text NOT NULL DEFAULT 'open',
      last_message_at integer,
      agent_read_at integer,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id text PRIMARY KEY,
      conversation_id text NOT NULL,
      sender text NOT NULL,
      body text NOT NULL,
      created_at integer NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS chat_conversations_last_idx ON chat_conversations(last_message_at);
    CREATE INDEX IF NOT EXISTS chat_messages_conv_idx ON chat_messages(conversation_id);
  `)
}
