import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from './index'
import {
  blogPosts,
  siteSettings,
  tripAddons,
  tripAvailability,
  tripCategories,
  tripFaqs,
  tripItineraryDays,
  trips,
} from './schema'

async function ensureCategory(name: string, slug: string, icon: string, sortOrder: number) {
  const [existing] = await db.select().from(tripCategories).where(eq(tripCategories.slug, slug)).limit(1)
  if (existing) return existing
  const id = nanoid()
  await db.insert(tripCategories).values({ id, name, slug, icon, sortOrder })
  const [created] = await db.select().from(tripCategories).where(eq(tripCategories.id, id)).limit(1)
  return created
}

async function tripExists(slug: string) {
  const [row] = await db.select({ id: trips.id }).from(trips).where(eq(trips.slug, slug)).limit(1)
  return Boolean(row)
}

export async function ensureDayTripSeed() {
  await db
    .update(siteSettings)
    .set({
      phone: '0974332069',
      whatsappNumber: '251974332069',
      telegramUsername: 'TripExplorerSupport',
      heroTitle: 'Discover Amazing Trips',
      heroSubtitle: 'Day trips from Addis, plus Dubai, Kenya, and Tanzania',
      heroVideoUrl: 'https://cdn.coverr.co/videos/coverr-drone-shot-of-a-lake-in-the-mountains-1584/1080p.mp4',
      facebookUrl: 'https://facebook.com',
      instagramUrl: 'https://instagram.com',
      tiktokUrl: 'https://www.tiktok.com',
      telebirrNumber: '0974332069',
      bankName: 'Commercial Bank of Ethiopia',
      bankAccount: '1000123456789',
    })
    .where(eq(siteSettings.id, 'default'))

  const oneDay = await ensureCategory('One Day Trip', 'one-day-trip', 'sun', 0)
  const twoDay = await ensureCategory('2 Days Trip', 'two-day-trip', 'calendar', 0)

  const wenchiCover = '/uploads/wenchi-crater-lake.jpg'
  const flyerUrl = '/uploads/wenchi-day-trip.jpg'

  if (!(await tripExists('wenchi-crater-lake-day-trip'))) {
    const tripId = nanoid()
    await db.insert(trips).values({
      id: tripId,
      categoryId: oneDay.id,
      title: 'Trip to Wenchi Crater Lake',
      titleAm: 'Trip to Wenchi Crater Lake',
      slug: 'wenchi-crater-lake-day-trip',
      description:
        'Escape the city and discover nature at Wenchi Crater Lake — a beautiful one-day group adventure about 150 km from Addis Ababa. Perfect for hiking, travel, and exploring with friends. All-inclusive day trip price.',
      descriptionAm:
        'Escape the city and discover nature at Wenchi Crater Lake — a one-day group adventure about 150 km from Addis Ababa.',
      destination: 'Wenchi Crater Lake (150 km from Addis Ababa)',
      price: 4300,
      durationDays: 1,
      maxGuests: 25,
      coverImageUrl: wenchiCover,
      galleryUrls: JSON.stringify([
        wenchiCover,
        'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      ]),
      highlights: JSON.stringify([
        'One Day Adventure',
        'All Inclusive',
        'Group Trip',
        'Hiking · Travel · Explore',
        'Escape the city. Discover nature.',
      ]),
      includedItems: JSON.stringify([
        'Transport (Round Trip)',
        'Tour Guide',
        'Entrance Fee',
        'Food (Lunch)',
        'Drinking Water',
      ]),
      excludedItems: JSON.stringify([
        'Personal expenses',
        'Tips for guide/driver',
        'Extra snacks or drinks beyond lunch',
      ]),
      difficulty: 'easy',
      fitnessLevel: 'Light walking and optional hike around the crater',
      minAge: 5,
      bestSeason: 'Year-round (best in dry season)',
      packingList: JSON.stringify([
        'Comfortable walking shoes',
        'Light jacket',
        'Sunscreen & hat',
        'Camera / phone',
        'Cash for personal extras',
      ]),
      cancellationPolicyText:
        'Free cancellation up to 48 hours before departure. Contact 0974332069 to reschedule.',
      depositPercent: 30,
      isFeatured: true,
      isPopular: true,
      isPublished: true,
    })

    await db.insert(tripItineraryDays).values([
      {
        id: nanoid(),
        tripId,
        dayNumber: 1,
        title: 'Full Day at Wenchi',
        description:
          'Early departure from Addis Ababa by bus. Arrive at Wenchi Crater Lake, explore with your tour guide, enjoy lunch, optional walks and views, then return to Addis the same evening.',
      },
    ])

    await db.insert(tripFaqs).values([
      {
        id: nanoid(),
        tripId,
        question: 'Is this a one-day trip?',
        answer: 'Yes. You leave and return to Addis Ababa on the same day.',
        sortOrder: 1,
      },
      {
        id: nanoid(),
        tripId,
        question: 'What does all-inclusive mean?',
        answer:
          'The 4,300 ETB price includes round-trip transport, tour guide, entrance fee, lunch, and drinking water.',
        sortOrder: 2,
      },
      {
        id: nanoid(),
        tripId,
        question: 'How do I book?',
        answer: 'Book on this website or call / WhatsApp 0974332069.',
        sortOrder: 3,
      },
    ])

    await db.insert(tripAddons).values([
      {
        id: nanoid(),
        tripId,
        name: 'Private seat upgrade',
        description: 'Preferential seating on the bus (subject to availability)',
        price: 300,
      },
    ])

    for (const date of ['2026-08-16', '2026-08-23', '2026-08-30', '2026-09-06']) {
      await db.insert(tripAvailability).values({
        id: nanoid(),
        tripId,
        date,
        spotsRemaining: 20,
      })
    }
  }

  if (!(await tripExists('debre-libanos-two-day-escape'))) {
    const tripId = nanoid()
    await db.insert(trips).values({
      id: tripId,
      categoryId: twoDay.id,
      title: 'Debre Libanos 2-Day Escape',
      titleAm: 'Debre Libanos 2-Day Escape',
      slug: 'debre-libanos-two-day-escape',
      description:
        'A relaxed two-day group trip from Addis Ababa. Day 1: travel, monastery visit, and nature walks with overnight stay nearby. Day 2: morning exploration, group breakfast, and return to Addis. Designed for friends and families who want more than a single day out.',
      descriptionAm:
        'A relaxed two-day group trip from Addis Ababa with overnight stay, meals, guide, and round-trip transport.',
      destination: 'Debre Libanos, Ethiopia',
      price: 7800,
      durationDays: 2,
      maxGuests: 20,
      coverImageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      ]),
      highlights: JSON.stringify([
        '2 Days Trip',
        'Overnight Stay Included',
        'Group Adventure',
        'Nature + Culture',
      ]),
      includedItems: JSON.stringify([
        'Transport (Round Trip)',
        'Tour Guide',
        'Entrance Fees',
        '1 Night Accommodation',
        'Meals (Lunch Day 1, Dinner, Breakfast Day 2)',
        'Drinking Water',
      ]),
      excludedItems: JSON.stringify([
        'Personal expenses',
        'Tips for guide/driver',
        'Optional boat or horse rides',
        'Travel insurance',
      ]),
      difficulty: 'easy',
      fitnessLevel: 'Light to moderate walking each day',
      minAge: 8,
      bestSeason: 'Year-round',
      packingList: JSON.stringify([
        'Overnight bag / small backpack',
        'Comfortable shoes',
        'Change of clothes',
        'Toothbrush & toiletries',
        'Light jacket for evening',
      ]),
      cancellationPolicyText:
        'Free cancellation up to 72 hours before departure for 2-day trips. Contact 0974332069.',
      depositPercent: 40,
      isFeatured: true,
      isPopular: true,
      isPublished: true,
    })

    await db.insert(tripItineraryDays).values([
      {
        id: nanoid(),
        tripId,
        dayNumber: 1,
        title: 'Travel & Explore',
        description:
          'Depart Addis in the morning. Visit Debre Libanos monastery and scenic viewpoints, enjoy lunch, then check into lodging and group dinner.',
      },
      {
        id: nanoid(),
        tripId,
        dayNumber: 2,
        title: 'Morning Nature & Return',
        description:
          'Breakfast, short morning hike or viewpoint visit, then return transport to Addis Ababa by afternoon/evening.',
      },
    ])

    await db.insert(tripFaqs).values([
      {
        id: nanoid(),
        tripId,
        question: 'How is this different from a one-day trip?',
        answer:
          'You stay overnight near the destination. Accommodation, dinner, and breakfast are included, so you have more time to explore.',
        sortOrder: 1,
      },
      {
        id: nanoid(),
        tripId,
        question: 'What is included in the price?',
        answer:
          'Round-trip transport, tour guide, entrance fees, 1 night stay, lunch/dinner/breakfast as listed, and drinking water.',
        sortOrder: 2,
      },
    ])

    await db.insert(tripAddons).values([
      {
        id: nanoid(),
        tripId,
        name: 'Single room upgrade',
        description: 'Private room instead of shared (if available)',
        price: 1200,
      },
    ])

    for (const date of ['2026-09-12', '2026-09-26', '2026-10-10']) {
      await db.insert(tripAvailability).values({
        id: nanoid(),
        tripId,
        date,
        spotsRemaining: 16,
      })
    }
  }

  const extraDates = ['2026-10-04', '2026-10-18', '2026-11-01', '2026-11-15']
  const published = await db
    .select({ id: trips.id, slug: trips.slug, coverImageUrl: trips.coverImageUrl, galleryUrls: trips.galleryUrls })
    .from(trips)
  for (const trip of published) {
    if (trip.slug === 'wenchi-crater-lake-day-trip') {
      const gallery = JSON.parse(trip.galleryUrls || '[]') as string[]
      const usesFlyer = trip.coverImageUrl === flyerUrl || gallery.includes(flyerUrl)
      await db
        .update(trips)
        .set({
          videoUrl: null,
          ...(usesFlyer
            ? {
                coverImageUrl: trip.coverImageUrl === flyerUrl ? wenchiCover : trip.coverImageUrl,
                galleryUrls: JSON.stringify(gallery.map((url) => (url === flyerUrl ? wenchiCover : url))),
              }
            : {}),
        })
        .where(eq(trips.id, trip.id))
    }
    for (const date of extraDates) {
      const [sameDate] = await db
        .select({ id: tripAvailability.id })
        .from(tripAvailability)
        .where(and(eq(tripAvailability.tripId, trip.id), eq(tripAvailability.date, date)))
        .limit(1)
      if (!sameDate) {
        await db.insert(tripAvailability).values({
          id: nanoid(),
          tripId: trip.id,
          date,
          spotsRemaining: 12,
        })
      }
    }
  }

  const [samplePost] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, 'a-day-at-wenchi-crater-lake'))
    .limit(1)

  if (!samplePost) {
    await db.insert(blogPosts).values({
      id: nanoid(),
      title: 'A Day at Wenchi Crater Lake',
      slug: 'a-day-at-wenchi-crater-lake',
      excerpt:
        'Sample travel story: photos and a short video from our one-day group trip to Wenchi, about 150 km from Addis Ababa.',
      coverImageUrl: '/uploads/wenchi-crater-lake.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=ugMTX8lKt-s',
      body: `This is a sample blog post so you can see how a trip story looks with a photo and a video.

We leave Addis Ababa in the morning and drive about 150 km to Wenchi Crater Lake. The crater is a bowl of green hills around still blue water, with a small island in the middle. After a short walk (or horse ride) down to the shore, the group takes in the views, enjoys lunch, and returns to Addis the same evening.

The photo at the top is from the lake. The video below is a short look at hiking around Wonchi — a real clip from Visit Ethiopia Tours, used here as an example.

Want to join the next departure? Book the Trip to Wenchi Crater Lake on this website, or call / WhatsApp 0974332069.`,
      isPublished: true,
      publishedAt: new Date(),
    })
  }
}
