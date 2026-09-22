import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { CANCELLATION_FAQ_ANSWER, LEGAL_PAGES } from '~/lib/legal-content'
import { db } from './index'
import {
  blogPosts,
  bookings,
  legalPages,
  promoCodes,
  siteFaqs,
  siteSettings,
  teamMembers,
  testimonials,
  tripAddons,
  tripAvailability,
  tripCategories,
  tripFaqs,
  tripItineraryDays,
  trips,
  users,
} from './schema'

export async function ensureSeed() {
  const existing = await db.select().from(siteSettings).limit(1)
  if (existing.length > 0) return

  await db.insert(siteSettings).values({ id: 'default' })

  const adminHash = bcrypt.hashSync('admin123', 10)
  await db.insert(users).values({
    id: nanoid(),
    email: 'admin@tripexplorer.com',
    passwordHash: adminHash,
    fullName: 'Site Admin',
    role: 'admin',
  })

  const customerHash = bcrypt.hashSync('customer123', 10)
  await db.insert(users).values({
    id: nanoid(),
    email: 'customer@example.com',
    passwordHash: customerHash,
    fullName: 'Demo Customer',
    phone: '0911000000',
    role: 'customer',
  })

  const categories = [
    { id: nanoid(), name: 'Adventure', slug: 'adventure', icon: 'mountain', sortOrder: 1 },
    { id: nanoid(), name: 'Cultural', slug: 'cultural', icon: 'landmark', sortOrder: 2 },
    { id: nanoid(), name: 'Safari', slug: 'safari', icon: 'binoculars', sortOrder: 3 },
    { id: nanoid(), name: 'City Tour', slug: 'city-tour', icon: 'building', sortOrder: 4 },
  ]
  await db.insert(tripCategories).values(categories)

  const tripData = [
    {
      id: nanoid(),
      categoryId: categories[0].id,
      title: 'Simien Mountains Trek',
      titleAm: 'ስሜን ተራሮች ጉዞ',
      slug: 'simien-mountains-trek',
      description:
        'Experience the breathtaking Simien Mountains National Park, a UNESCO World Heritage site. Trek through dramatic landscapes, spot gelada baboons, and witness stunning vistas.',
      destination: 'Gondar, Ethiopia',
      price: 15000,
      priceUsd: 270,
      durationDays: 5,
      maxGuests: 12,
      coverImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      ]),
      highlights: JSON.stringify(['UNESCO Site', 'Gelada Baboons', 'Expert Guides', 'Camping']),
      includedItems: JSON.stringify(['Transport', 'Guide', 'Camping gear', 'Meals', 'Park fees']),
      excludedItems: JSON.stringify(['Flights', 'Personal expenses', 'Tips']),
      difficulty: 'moderate',
      fitnessLevel: '4-6 hours walking per day',
      minAge: 12,
      bestSeason: 'October - March',
      packingList: JSON.stringify(['Hiking boots', 'Warm layers', 'Sunscreen', 'Water bottle']),
      mapEmbedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=38.2,13.0,38.5,13.5',
      isFeatured: true,
      isPopular: true,
      isPublished: true,
    },
    {
      id: nanoid(),
      categoryId: categories[1].id,
      title: 'Lalibela Rock Churches',
      titleAm: 'ላሊበላ የዓለት ቤተክርስቲያናት',
      slug: 'lalibela-rock-churches',
      description:
        'Discover the magnificent rock-hewn churches of Lalibela, one of Ethiopia\'s holiest cities. Explore ancient architecture carved from solid rock.',
      destination: 'Lalibela, Ethiopia',
      price: 12000,
      priceUsd: 215,
      durationDays: 3,
      maxGuests: 20,
      coverImageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
      ]),
      highlights: JSON.stringify(['UNESCO Site', 'Ancient Churches', 'Cultural Experience']),
      includedItems: JSON.stringify(['Hotel', 'Guide', 'Transport', 'Breakfast']),
      excludedItems: JSON.stringify(['Flights', 'Lunch & Dinner', 'Tips']),
      difficulty: 'easy',
      minAge: 0,
      bestSeason: 'Year-round',
      isFeatured: true,
      isPublished: true,
    },
    {
      id: nanoid(),
      categoryId: categories[2].id,
      title: 'Bale Mountains Safari',
      titleAm: 'ባሌ ተራሮች ሳፋሪ',
      slug: 'bale-mountains-safari',
      description:
        'Wildlife safari in Bale Mountains National Park. Spot Ethiopian wolves, mountain nyala, and diverse bird species in pristine highland habitat.',
      destination: 'Bale, Ethiopia',
      price: 18000,
      priceUsd: 320,
      durationDays: 4,
      maxGuests: 8,
      coverImageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      ]),
      highlights: JSON.stringify(['Ethiopian Wolf', 'Wildlife', '4x4 Safari']),
      includedItems: JSON.stringify(['4x4 vehicle', 'Guide', 'Park fees', 'Lodging']),
      excludedItems: JSON.stringify(['Flights', 'Personal gear']),
      difficulty: 'moderate',
      isLastMinuteDeal: true,
      isPublished: true,
    },
  ]

  await db.insert(trips).values(tripData)

  for (const trip of tripData) {
    await db.insert(tripItineraryDays).values([
      {
        id: nanoid(),
        tripId: trip.id,
        dayNumber: 1,
        title: 'Arrival & Orientation',
        description: 'Meet your guide, briefing, and settle in.',
      },
      {
        id: nanoid(),
        tripId: trip.id,
        dayNumber: 2,
        title: 'Main Exploration',
        description: 'Full day exploring the highlights of the destination.',
      },
    ])

    await db.insert(tripAddons).values([
      {
        id: nanoid(),
        tripId: trip.id,
        name: 'Airport Transfer',
        description: 'Private pickup from airport',
        price: 1500,
      },
      {
        id: nanoid(),
        tripId: trip.id,
        name: 'Extra Night',
        description: 'Additional hotel night',
        price: 2500,
      },
    ])

    const dates = ['2026-09-15', '2026-09-22', '2026-10-01', '2026-10-15']
    for (const date of dates) {
      await db.insert(tripAvailability).values({
        id: nanoid(),
        tripId: trip.id,
        date,
        spotsRemaining: Math.floor(Math.random() * 8) + 3,
      })
    }
  }

  await db.insert(promoCodes).values({
    id: nanoid(),
    code: 'WELCOME10',
    discountType: 'percent',
    discountValue: 10,
    maxUses: 100,
    isActive: true,
  })

  await db.insert(testimonials).values([
    {
      id: nanoid(),
      customerName: 'Sarah M.',
      tripName: 'Simien Mountains Trek',
      quote: 'An absolutely incredible experience! The guides were knowledgeable and the views were breathtaking.',
      rating: 5,
      isFeatured: true,
    },
    {
      id: nanoid(),
      customerName: 'James K.',
      tripName: 'Lalibela Rock Churches',
      quote: 'A spiritual journey through history. Highly recommend this trip to anyone visiting Ethiopia.',
      rating: 5,
      isFeatured: true,
    },
  ])

  await db.insert(siteFaqs).values([
    {
      id: nanoid(),
      question: 'How do I book a trip?',
      answer: 'Browse our trips, select your preferred date, fill in the booking form, and complete payment.',
      sortOrder: 1,
    },
    {
      id: nanoid(),
      question: 'What is your cancellation policy?',
      answer: CANCELLATION_FAQ_ANSWER,
      sortOrder: 2,
    },
    {
      id: nanoid(),
      question: 'Do you offer group discounts?',
      answer: 'Yes. Groups of 5 or more get 5% off, and groups of 10 or more get 10% off automatically at booking.',
      sortOrder: 3,
    },
  ])

  await db.insert(legalPages).values(
    LEGAL_PAGES.map((page) => ({
      id: nanoid(),
      slug: page.slug,
      title: page.title,
      body: page.body,
    })),
  )

  await db.insert(blogPosts).values({
    id: nanoid(),
    title: 'Top 5 Destinations in Ethiopia',
    slug: 'top-5-destinations-ethiopia',
    excerpt: 'Discover the most breathtaking places to visit in Ethiopia.',
    body: '<p>Ethiopia offers incredible diversity from ancient history to stunning natural landscapes...</p>',
    coverImageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800',
    isPublished: true,
    publishedAt: new Date(),
  })

  await db.insert(teamMembers).values([
    {
      id: nanoid(),
      name: 'Abebe Kebede',
      role: 'Lead Guide',
      bio: '15 years of experience guiding treks across Ethiopia.',
      sortOrder: 1,
    },
    {
      id: nanoid(),
      name: 'Meron Tesfaye',
      role: 'Travel Coordinator',
      bio: 'Ensures every trip runs smoothly from booking to return.',
      sortOrder: 2,
    },
  ])
}

export async function resetAdminPassword() {
  const hash = bcrypt.hashSync('admin123', 10)
  await db.update(users).set({ passwordHash: hash }).where(eq(users.email, 'admin@tripexplorer.com'))
}
