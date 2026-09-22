import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name'),
    phone: text('phone'),
    role: text('role').notNull().default('customer'),
    resetTokenHash: text('reset_token_hash'),
    resetTokenExpiresAt: integer('reset_token_expires_at', { mode: 'timestamp' }),
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    emailVerifyCodeHash: text('email_verify_code_hash'),
    emailVerifyExpiresAt: integer('email_verify_expires_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('users_role_idx').on(t.role)],
)

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const tripCategories = sqliteTable('trip_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').default('map'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const trips = sqliteTable(
  'trips',
  {
    id: text('id').primaryKey(),
    categoryId: text('category_id').references(() => tripCategories.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    titleAm: text('title_am'),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().default(''),
    descriptionAm: text('description_am'),
    destination: text('destination').notNull(),
    price: integer('price').notNull(),
    priceUsd: integer('price_usd'),
    durationDays: integer('duration_days').notNull().default(1),
    maxGuests: integer('max_guests').notNull().default(20),
    offersPrivatePackage: integer('offers_private_package', { mode: 'boolean' }).notNull().default(true),
    offersFamilyTrip: integer('offers_family_trip', { mode: 'boolean' }).notNull().default(true),
    privatePackageGuests: integer('private_package_guests').notNull().default(15),
    privatePackagePrice: integer('private_package_price'),
    familyMaxGuests: integer('family_max_guests').notNull().default(8),
    coverImageUrl: text('cover_image_url').notNull().default(''),
    galleryUrls: text('gallery_urls').default('[]'),
    highlights: text('highlights').default('[]'),
    includedItems: text('included_items').default('[]'),
    excludedItems: text('excluded_items').default('[]'),
    difficulty: text('difficulty').default('easy'),
    fitnessLevel: text('fitness_level'),
    minAge: integer('min_age'),
    bestSeason: text('best_season'),
    packingList: text('packing_list').default('[]'),
    videoUrl: text('video_url'),
    mapEmbedUrl: text('map_embed_url'),
    cancellationPolicyText: text('cancellation_policy_text'),
    depositPercent: integer('deposit_percent').notNull().default(30),
    isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
    isPopular: integer('is_popular', { mode: 'boolean' }).notNull().default(false),
    isLastMinuteDeal: integer('is_last_minute_deal', { mode: 'boolean' }).notNull().default(false),
    isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
    bookingCount: integer('booking_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('trips_category_idx').on(t.categoryId),
    index('trips_published_idx').on(t.isPublished),
    index('trips_destination_idx').on(t.destination),
  ],
)

export const tripItineraryDays = sqliteTable('trip_itinerary_days', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
})

export const tripAddons = sqliteTable('trip_addons', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

export const tripFaqs = sqliteTable('trip_faqs', {
  id: text('id').primaryKey(),
  tripId: text('trip_id').references(() => trips.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const tripAvailability = sqliteTable(
  'trip_availability',
  {
    id: text('id').primaryKey(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    spotsRemaining: integer('spots_remaining').notNull().default(10),
    priceOverride: integer('price_override'),
    isBlocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [uniqueIndex('trip_date_unique').on(t.tripId, t.date)],
)

export const promoCodes = sqliteTable('promo_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

export const bookings = sqliteTable(
  'bookings',
  {
    id: text('id').primaryKey(),
    referenceNumber: text('reference_number').notNull().unique(),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: text('customer_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    travelDate: text('travel_date').notNull(),
    guestCount: integer('guest_count').notNull().default(1),
    partyType: text('party_type').notNull().default('shared'),
    notes: text('notes'),
    addonIds: text('addon_ids').default('[]'),
    promoCodeId: text('promo_code_id').references(() => promoCodes.id),
    discountAmount: integer('discount_amount').notNull().default(0),
    totalPrice: integer('total_price').notNull(),
    depositAmount: integer('deposit_amount').notNull().default(0),
    remainingAmount: integer('remaining_amount').notNull().default(0),
    paymentType: text('payment_type').notNull().default('full'),
    paymentMethod: text('payment_method'),
    paymentStatus: text('payment_status').notNull().default('pending'),
    paymentProofUrl: text('payment_proof_url'),
    status: text('status').notNull().default('pending'),
    cancellationRequestedAt: integer('cancellation_requested_at', { mode: 'timestamp' }),
    modificationNotes: text('modification_notes'),
    reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('bookings_trip_idx').on(t.tripId),
    index('bookings_user_idx').on(t.userId),
    index('bookings_status_idx').on(t.status),
  ],
)

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  bookingId: text('booking_id').references(() => bookings.id),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const wishlist = sqliteTable(
  'wishlist',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tripId: text('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [uniqueIndex('wishlist_user_trip').on(t.userId, t.tripId)],
)

export const waitingList = sqliteTable('waiting_list', {
  id: text('id').primaryKey(),
  tripId: text('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  travelDate: text('travel_date').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  guestCount: integer('guest_count').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const chatConversations = sqliteTable(
  'chat_conversations',
  {
    id: text('id').primaryKey(),
    visitorName: text('visitor_name'),
    visitorEmail: text('visitor_email'),
    userId: text('user_id'),
    status: text('status').notNull().default('open'),
    lastMessageAt: integer('last_message_at', { mode: 'timestamp' }),
    agentReadAt: integer('agent_read_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('chat_conversations_last_idx').on(t.lastMessageAt)],
)

export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    sender: text('sender').notNull(),
    body: text('body').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('chat_messages_conv_idx').on(t.conversationId)],
)

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('general'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const newsletterSubscribers = sqliteTable(
  'newsletter_subscribers',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    subscribedAt: integer('subscribed_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
)

export const blogPosts = sqliteTable('blog_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  coverImageUrl: text('cover_image_url'),
  videoUrl: text('video_url'),
  excerpt: text('excerpt'),
  body: text('body').notNull().default(''),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const siteFaqs = sqliteTable('site_faqs', {
  id: text('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
})

export const legalPages = sqliteTable('legal_pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const testimonials = sqliteTable('testimonials', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  tripName: text('trip_name'),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull().default(5),
  photoUrl: text('photo_url'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
})

export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const siteSettings = sqliteTable('site_settings', {
  id: text('id').primaryKey().default('default'),
  businessName: text('business_name').notNull().default('Trip Explorer'),
  email: text('email').notNull().default('info@tripexplorer.com'),
  phone: text('phone').notNull().default('+251911000000'),
  address: text('address').default('Addis Ababa, Ethiopia'),
  facebookUrl: text('facebook_url'),
  instagramUrl: text('instagram_url'),
  tiktokUrl: text('tiktok_url'),
  whatsappNumber: text('whatsapp_number').default('251911000000'),
  telegramUsername: text('telegram_username').default('TripExplorerSupport'),
  aboutText: text('about_text'),
  heroTitle: text('hero_title').default('Discover Amazing Trips'),
  heroSubtitle: text('hero_subtitle').default('Book unforgettable adventures across Ethiopia and beyond'),
  heroVideoUrl: text('hero_video_url').default('https://www.youtube.com/watch?v=jNQXAC9IVRw'),
  telebirrNumber: text('telebirr_number'),
  bankName: text('bank_name'),
  bankAccount: text('bank_account'),
  telebirrQrUrl: text('telebirr_qr_url'),
  bankQrUrl: text('bank_qr_url'),
  analyticsId: text('analytics_id'),
  defaultDepositPercent: integer('default_deposit_percent').notNull().default(30),
  groupDiscountSmallMinGuests: integer('group_discount_small_min_guests').notNull().default(5),
  groupDiscountSmallPercent: integer('group_discount_small_percent').notNull().default(5),
  groupDiscountMinGuests: integer('group_discount_min_guests').notNull().default(10),
  groupDiscountPercent: integer('group_discount_percent').notNull().default(10),
  privatePackageGuests: integer('private_package_guests').notNull().default(15),
  familyMaxGuests: integer('family_max_guests').notNull().default(8),
  homepageJson: text('homepage_json'),
  smtpHost: text('smtp_host'),
  smtpPort: integer('smtp_port').default(587),
  smtpUser: text('smtp_user'),
  smtpPass: text('smtp_pass'),
  smtpFrom: text('smtp_from'),
  telegramBotToken: text('telegram_bot_token'),
  telegramBotUsername: text('telegram_bot_username'),
  telegramUpdateOffset: integer('telegram_update_offset').notNull().default(0),
  smsEnabled: integer('sms_enabled', { mode: 'boolean' }).notNull().default(false),
  smsApiToken: text('sms_api_token'),
  smsSenderName: text('sms_sender_name'),
  smsIdentifier: text('sms_identifier'),
})

export type User = typeof users.$inferSelect
export type Trip = typeof trips.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type SiteSettings = typeof siteSettings.$inferSelect
