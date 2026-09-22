import type Database from 'better-sqlite3'

/** Create core tables on a fresh disk (needed on Render free). Column adds stay in ensure-columns. */
export function ensureTables(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      full_name text,
      phone text,
      role text NOT NULL DEFAULT 'customer',
      reset_token_hash text,
      reset_token_expires_at integer,
      email_verified integer NOT NULL DEFAULT 0,
      email_verify_code_hash text,
      email_verify_expires_at integer,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      expires_at integer NOT NULL,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS trip_categories (
      id text PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      icon text DEFAULT 'map',
      sort_order integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS trips (
      id text PRIMARY KEY,
      category_id text REFERENCES trip_categories(id) ON DELETE SET NULL,
      title text NOT NULL,
      title_am text,
      slug text NOT NULL UNIQUE,
      description text NOT NULL DEFAULT '',
      description_am text,
      destination text NOT NULL,
      price integer NOT NULL,
      price_usd integer,
      duration_days integer NOT NULL DEFAULT 1,
      max_guests integer NOT NULL DEFAULT 20,
      offers_private_package integer NOT NULL DEFAULT 1,
      offers_family_trip integer NOT NULL DEFAULT 1,
      private_package_guests integer NOT NULL DEFAULT 15,
      private_package_price integer,
      family_max_guests integer NOT NULL DEFAULT 8,
      cover_image_url text NOT NULL DEFAULT '',
      gallery_urls text DEFAULT '[]',
      highlights text DEFAULT '[]',
      included_items text DEFAULT '[]',
      excluded_items text DEFAULT '[]',
      difficulty text DEFAULT 'easy',
      fitness_level text,
      min_age integer,
      best_season text,
      packing_list text DEFAULT '[]',
      video_url text,
      map_embed_url text,
      cancellation_policy_text text,
      deposit_percent integer NOT NULL DEFAULT 30,
      is_featured integer NOT NULL DEFAULT 0,
      is_popular integer NOT NULL DEFAULT 0,
      is_last_minute_deal integer NOT NULL DEFAULT 0,
      is_published integer NOT NULL DEFAULT 0,
      booking_count integer NOT NULL DEFAULT 0,
      created_at integer NOT NULL DEFAULT (unixepoch()),
      updated_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS trips_category_idx ON trips(category_id);
    CREATE INDEX IF NOT EXISTS trips_published_idx ON trips(is_published);
    CREATE INDEX IF NOT EXISTS trips_destination_idx ON trips(destination);

    CREATE TABLE IF NOT EXISTS trip_itinerary_days (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      day_number integer NOT NULL,
      title text NOT NULL,
      description text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS trip_addons (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      price integer NOT NULL DEFAULT 0,
      is_active integer NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS trip_faqs (
      id text PRIMARY KEY,
      trip_id text REFERENCES trips(id) ON DELETE CASCADE,
      question text NOT NULL,
      answer text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS trip_availability (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      date text NOT NULL,
      spots_remaining integer NOT NULL DEFAULT 10,
      price_override integer,
      is_blocked integer NOT NULL DEFAULT 0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS trip_date_unique ON trip_availability(trip_id, date);

    CREATE TABLE IF NOT EXISTS promo_codes (
      id text PRIMARY KEY,
      code text NOT NULL UNIQUE,
      discount_type text NOT NULL,
      discount_value integer NOT NULL,
      max_uses integer,
      used_count integer NOT NULL DEFAULT 0,
      expires_at integer,
      is_active integer NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id text PRIMARY KEY,
      reference_number text NOT NULL UNIQUE,
      trip_id text NOT NULL REFERENCES trips(id),
      user_id text REFERENCES users(id) ON DELETE SET NULL,
      customer_name text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL,
      travel_date text NOT NULL,
      guest_count integer NOT NULL DEFAULT 1,
      party_type text NOT NULL DEFAULT 'shared',
      notes text,
      addon_ids text DEFAULT '[]',
      promo_code_id text REFERENCES promo_codes(id),
      discount_amount integer NOT NULL DEFAULT 0,
      total_price integer NOT NULL,
      deposit_amount integer NOT NULL DEFAULT 0,
      remaining_amount integer NOT NULL DEFAULT 0,
      payment_type text NOT NULL DEFAULT 'full',
      payment_method text,
      payment_status text NOT NULL DEFAULT 'pending',
      payment_proof_url text,
      status text NOT NULL DEFAULT 'pending',
      cancellation_requested_at integer,
      modification_notes text,
      reminder_sent_at integer,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS bookings_trip_idx ON bookings(trip_id);
    CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

    CREATE TABLE IF NOT EXISTS reviews (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id text REFERENCES bookings(id),
      rating integer NOT NULL,
      comment text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE UNIQUE INDEX IF NOT EXISTS wishlist_user_trip ON wishlist(user_id, trip_id);

    CREATE TABLE IF NOT EXISTS waiting_list (
      id text PRIMARY KEY,
      trip_id text NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      travel_date text NOT NULL,
      name text NOT NULL,
      email text NOT NULL,
      phone text,
      guest_count integer NOT NULL DEFAULT 1,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

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
    CREATE INDEX IF NOT EXISTS chat_conversations_last_idx ON chat_conversations(last_message_at);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id text PRIMARY KEY,
      conversation_id text NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender text NOT NULL,
      body text NOT NULL,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS chat_messages_conv_idx ON chat_messages(conversation_id);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL,
      subject text NOT NULL,
      message text NOT NULL,
      type text NOT NULL DEFAULT 'general',
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      subscribed_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text NOT NULL UNIQUE,
      cover_image_url text,
      video_url text,
      excerpt text,
      body text NOT NULL DEFAULT '',
      is_published integer NOT NULL DEFAULT 0,
      published_at integer,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS site_faqs (
      id text PRIMARY KEY,
      question text NOT NULL,
      answer text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      is_published integer NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS legal_pages (
      id text PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      body text NOT NULL DEFAULT '',
      updated_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id text PRIMARY KEY,
      customer_name text NOT NULL,
      trip_name text,
      quote text NOT NULL,
      rating integer NOT NULL DEFAULT 5,
      photo_url text,
      is_featured integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id text PRIMARY KEY,
      name text NOT NULL,
      role text NOT NULL,
      bio text,
      photo_url text,
      sort_order integer NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id text PRIMARY KEY DEFAULT 'default',
      business_name text NOT NULL DEFAULT 'Trip Explorer',
      email text NOT NULL DEFAULT 'info@tripexplorer.com',
      phone text NOT NULL DEFAULT '+251911000000',
      address text DEFAULT 'Addis Ababa, Ethiopia',
      facebook_url text,
      instagram_url text,
      tiktok_url text,
      whatsapp_number text DEFAULT '251911000000',
      telegram_username text DEFAULT 'TripExplorerSupport',
      about_text text,
      hero_title text DEFAULT 'Discover Amazing Trips',
      hero_subtitle text DEFAULT 'Book unforgettable adventures across Ethiopia and beyond',
      hero_video_url text DEFAULT 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      telebirr_number text,
      bank_name text,
      bank_account text,
      telebirr_qr_url text,
      bank_qr_url text,
      analytics_id text,
      default_deposit_percent integer NOT NULL DEFAULT 30,
      group_discount_small_min_guests integer NOT NULL DEFAULT 5,
      group_discount_small_percent integer NOT NULL DEFAULT 5,
      group_discount_min_guests integer NOT NULL DEFAULT 10,
      group_discount_percent integer NOT NULL DEFAULT 10,
      private_package_guests integer NOT NULL DEFAULT 15,
      family_max_guests integer NOT NULL DEFAULT 8,
      homepage_json text,
      smtp_host text,
      smtp_port integer DEFAULT 587,
      smtp_user text,
      smtp_pass text,
      smtp_from text,
      telegram_bot_token text,
      telegram_bot_username text,
      telegram_update_offset integer NOT NULL DEFAULT 0,
      sms_enabled integer NOT NULL DEFAULT 0,
      sms_api_token text,
      sms_sender_name text,
      sms_identifier text
    );
  `)
}
