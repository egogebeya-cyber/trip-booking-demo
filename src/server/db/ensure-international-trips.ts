import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { DEFAULT_HOMEPAGE, parseHomepageContent } from '~/lib/homepage-content'
import { db } from './index'
import {
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

type PackedTrip = {
  slug: string
  title: string
  destination: string
  description: string
  price: number
  priceUsd: number
  durationDays: number
  maxGuests: number
  coverImageUrl: string
  galleryUrls: string[]
  highlights: string[]
  includedItems: string[]
  excludedItems: string[]
  difficulty: string
  fitnessLevel: string
  minAge: number
  bestSeason: string
  packingList: string[]
  mapEmbedUrl: string
  itinerary: { dayNumber: number; title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  addons: { name: string; description: string; price: number }[]
  dates: string[]
  featured?: boolean
  popular?: boolean
}

async function insertPackedTrip(categoryId: string, spec: PackedTrip) {
  if (await tripExists(spec.slug)) return
  const tripId = nanoid()
  await db.insert(trips).values({
    id: tripId,
    categoryId,
    title: spec.title,
    titleAm: spec.title,
    slug: spec.slug,
    description: spec.description,
    descriptionAm: spec.description,
    destination: spec.destination,
    price: spec.price,
    priceUsd: spec.priceUsd,
    durationDays: spec.durationDays,
    maxGuests: spec.maxGuests,
    coverImageUrl: spec.coverImageUrl,
    galleryUrls: JSON.stringify(spec.galleryUrls),
    highlights: JSON.stringify(spec.highlights),
    includedItems: JSON.stringify(spec.includedItems),
    excludedItems: JSON.stringify(spec.excludedItems),
    difficulty: spec.difficulty,
    fitnessLevel: spec.fitnessLevel,
    minAge: spec.minAge,
    bestSeason: spec.bestSeason,
    packingList: JSON.stringify(spec.packingList),
    mapEmbedUrl: spec.mapEmbedUrl,
    cancellationPolicyText:
      'Free cancellation up to 14 days before departure. 50% refund between 7 and 14 days. No refund inside 7 days. Contact 0974332069.',
    depositPercent: 40,
    isFeatured: Boolean(spec.featured),
    isPopular: Boolean(spec.popular),
    isPublished: true,
  })

  await db.insert(tripItineraryDays).values(
    spec.itinerary.map((day) => ({
      id: nanoid(),
      tripId,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
    })),
  )
  await db.insert(tripFaqs).values(
    spec.faqs.map((faq, i) => ({
      id: nanoid(),
      tripId,
      question: faq.question,
      answer: faq.answer,
      sortOrder: i + 1,
    })),
  )
  await db.insert(tripAddons).values(
    spec.addons.map((addon) => ({
      id: nanoid(),
      tripId,
      name: addon.name,
      description: addon.description,
      price: addon.price,
    })),
  )
  for (const date of spec.dates) {
    await db.insert(tripAvailability).values({
      id: nanoid(),
      tripId,
      date,
      spotsRemaining: 12,
    })
  }
}

export async function ensureInternationalTrips() {
  const international = await ensureCategory('International', 'international', 'globe', 10)

  await insertPackedTrip(international.id, {
    slug: 'dubai-city-desert-5-days',
    title: 'Dubai City & Desert — 5 Days',
    destination: 'Dubai, United Arab Emirates',
    description:
      'A 5-day group trip from Addis Ababa to Dubai. See the city skyline, Dubai Mall and Burj Khalifa area, a dhow cruise on Dubai Marina, and a desert safari with dinner. Flights from Addis, hotel, and airport transfers are included. Visa is extra — we help you apply.',
    price: 95000,
    priceUsd: 1730,
    durationDays: 5,
    maxGuests: 16,
    coverImageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200',
    galleryUrls: [
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      'https://images.unsplash.com/photo-1528702748617-c82ea734d5b5?w=800',
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800',
    ],
    highlights: ['International', 'Flights from Addis', 'Desert safari', 'City tour'],
    includedItems: [
      'Round-trip flights Addis Ababa – Dubai',
      '4 nights hotel (twin share)',
      'Airport transfers',
      'Dubai city tour',
      'Desert safari with dinner',
      'Marina dhow cruise',
      'Tour coordinator',
      'Daily breakfast',
    ],
    excludedItems: [
      'UAE visa fees',
      'Lunches and most dinners (except safari dinner)',
      'Burj Khalifa ticket (optional add-on)',
      'Travel insurance',
      'Personal shopping',
    ],
    difficulty: 'easy',
    fitnessLevel: 'City walking and an evening desert drive',
    minAge: 5,
    bestSeason: 'October to April (cooler evenings)',
    packingList: ['Passport (6+ months validity)', 'Light clothes', 'Modest outfit for mall/mosque stops', 'Sunglasses'],
    mapEmbedUrl: 'https://www.google.com/maps?q=Dubai+United+Arab+Emirates&output=embed',
    itinerary: [
      { dayNumber: 1, title: 'Addis to Dubai', description: 'Fly from Addis Ababa. Airport pickup and hotel check-in. Free evening at the hotel or nearby mall.' },
      { dayNumber: 2, title: 'Dubai city', description: 'Guided city tour: old Dubai, Dubai Mall / fountain area, photo stops at the skyline. Evening free.' },
      { dayNumber: 3, title: 'Desert safari', description: 'Morning free for shopping or rest. Afternoon desert safari, dune drive, and BBQ dinner in camp.' },
      { dayNumber: 4, title: 'Marina cruise', description: 'Free morning. Evening dhow cruise on Dubai Marina with views of the waterfront.' },
      { dayNumber: 5, title: 'Fly home', description: 'Breakfast, hotel checkout, transfer to DXB, return flight to Addis Ababa.' },
    ],
    faqs: [
      { question: 'Is the flight included?', answer: 'Yes. Group return flights from Addis Ababa to Dubai are included in the ETB price. Exact airline and times are sent after we confirm the departure.' },
      { question: 'Do I need a visa?', answer: 'Yes. UAE visa is not included. We share the document list and help you apply. Passport must be valid at least 6 months.' },
      { question: 'How do I pay from Ethiopia?', answer: 'Pay the deposit or full amount by Telebirr or bank transfer on this website, then upload your receipt. WhatsApp 0974332069 if you need the account details again.' },
    ],
    addons: [
      { name: 'Burj Khalifa 124th floor', description: 'Skip-the-line ticket, subject to availability', price: 4500 },
      { name: 'Single room', description: 'Private hotel room instead of twin share', price: 18000 },
    ],
    dates: ['2026-10-15', '2026-11-12', '2026-12-10', '2027-01-14'],
    featured: true,
    popular: true,
  })

  await insertPackedTrip(international.id, {
    slug: 'kenya-maasai-mara-5-days',
    title: 'Kenya Maasai Mara Safari — 5 Days',
    destination: 'Maasai Mara, Kenya',
    description:
      'A 5-day safari from Addis Ababa to Kenya’s Maasai Mara. Game drives for lion, elephant, giraffe, and (in season) wildebeest. Nights in a safari lodge/camp. Flights Addis–Nairobi, park fees, and full-board on safari days are included. Kenya eTA is extra.',
    price: 128000,
    priceUsd: 2330,
    durationDays: 5,
    maxGuests: 12,
    coverImageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200',
    galleryUrls: [
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      'https://images.unsplash.com/photo-1534177616071-bef006cf8186?w=800',
      'https://images.unsplash.com/photo-1484318571209-661cf29a69c3?w=800',
    ],
    highlights: ['International', 'Maasai Mara', 'Game drives', 'Flights from Addis'],
    includedItems: [
      'Round-trip flights Addis Ababa – Nairobi',
      'Nairobi–Mara road or air transfer as listed for the date',
      '4 nights (1 Nairobi + 3 Mara camp/lodge, twin share)',
      'Park fees',
      'Shared game drives',
      'Full board while in the Mara',
      'Safari guide / driver',
      'Airport transfers in Nairobi',
    ],
    excludedItems: [
      'Kenya eTA / visa',
      'Tips for ranger and camp staff',
      'Drinks beyond meals',
      'Travel insurance',
      'Optional Maasai village visit (add-on)',
    ],
    difficulty: 'moderate',
    fitnessLevel: 'Long drives and early morning game drives. You stay in the vehicle unless the camp walk is optional.',
    minAge: 8,
    bestSeason: 'July–October (migration) and January–March (calving / dry)',
    packingList: ['Passport', 'Neutral-colour clothes', 'Binoculars if you have them', 'Malaria advice from your clinic', 'Warm layer for dawn drives'],
    mapEmbedUrl: 'https://www.google.com/maps?q=Maasai+Mara+National+Reserve+Kenya&output=embed',
    itinerary: [
      { dayNumber: 1, title: 'Addis to Nairobi', description: 'Fly to Nairobi. Transfer to a city hotel. Briefing for the safari.' },
      { dayNumber: 2, title: 'Into the Mara', description: 'Travel to Maasai Mara. Afternoon game drive. Dinner and overnight at camp/lodge.' },
      { dayNumber: 3, title: 'Full day safari', description: 'Dawn and afternoon game drives. Search for big cats, elephants, and plains game.' },
      { dayNumber: 4, title: 'Mara morning & return', description: 'Morning drive, then travel back toward Nairobi. Overnight Nairobi.' },
      { dayNumber: 5, title: 'Fly to Addis', description: 'Breakfast and transfer to the airport for the return flight to Addis Ababa.' },
    ],
    faqs: [
      { question: 'Are flights included?', answer: 'Yes. Addis Ababa–Nairobi return is included. Internal Nairobi–Mara transport is included as described for your departure date.' },
      { question: 'Visa for Kenya?', answer: 'Most travellers need a Kenya eTA before travel. It is not in the package price. We send the official link and a checklist after you book.' },
      { question: 'Is yellow fever required?', answer: 'Kenya may ask for a yellow-fever certificate if you arrive from Ethiopia. Carry your booklet. Ask your clinic before you pay the balance.' },
    ],
    addons: [
      { name: 'Maasai village visit', description: 'Guided community visit, paid to the village', price: 3500 },
      { name: 'Single tent/room', description: 'Private room in camp if available', price: 22000 },
    ],
    dates: ['2026-10-20', '2026-11-17', '2026-12-15', '2027-02-09'],
    featured: true,
    popular: true,
  })

  await insertPackedTrip(international.id, {
    slug: 'tanzania-serengeti-ngorongoro-6-days',
    title: 'Tanzania Serengeti & Ngorongoro — 6 Days',
    destination: 'Serengeti & Ngorongoro, Tanzania',
    description:
      'A 6-day Tanzania safari from Addis Ababa: Serengeti plains and Ngorongoro Crater. Group package with flights to Kilimanjaro or Dar es Salaam (as confirmed per date), lodges/camps, park fees, and a safari vehicle. Tanzania e-visa is extra. Built for travellers who want wildlife beyond Ethiopia.',
    price: 165000,
    priceUsd: 3000,
    durationDays: 6,
    maxGuests: 12,
    coverImageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200',
    galleryUrls: [
      'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
      'https://images.unsplash.com/photo-1484406566174-9da000314829?w=800',
    ],
    highlights: ['International', 'Serengeti', 'Ngorongoro Crater', 'Flights from Addis'],
    includedItems: [
      'Round-trip flights Addis Ababa – Tanzania (JRO or DAR as listed)',
      '5 nights lodge/camp (twin share)',
      'Park and crater fees',
      'Safari vehicle and driver-guide',
      'Full board on safari days',
      'Airport transfers',
    ],
    excludedItems: [
      'Tanzania e-visa',
      'Tips',
      'Balloon safari (optional add-on)',
      'Travel insurance',
      'Drinks beyond meals',
    ],
    difficulty: 'moderate',
    fitnessLevel: 'Long safari days. Crater descent is by vehicle. Short walks at camp only.',
    minAge: 8,
    bestSeason: 'June–October and December–March',
    packingList: ['Passport', 'Dust-coloured clothing', 'Hat and sunscreen', 'Camera with spare battery', 'Yellow-fever booklet'],
    mapEmbedUrl: 'https://www.google.com/maps?q=Serengeti+National+Park+Tanzania&output=embed',
    itinerary: [
      { dayNumber: 1, title: 'Fly to Tanzania', description: 'Addis to Kilimanjaro or Dar. Meet the driver. Overnight Arusha or similar.' },
      { dayNumber: 2, title: 'Toward Serengeti', description: 'Drive with game viewing toward Serengeti. Overnight in the park area.' },
      { dayNumber: 3, title: 'Serengeti', description: 'Full day of game drives on the plains.' },
      { dayNumber: 4, title: 'Serengeti to Ngorongoro', description: 'Morning game drive, then travel to the Ngorongoro highlands.' },
      { dayNumber: 5, title: 'Ngorongoro Crater', description: 'Descend into the crater for a full-day wildlife circuit, then overnight on the rim or nearby.' },
      { dayNumber: 6, title: 'Return to Addis', description: 'Transfer to the airport and fly back to Addis Ababa.' },
    ],
    faqs: [
      { question: 'Are flights included?', answer: 'Yes, group return flights from Addis are included. We confirm the airport (Kilimanjaro or Dar) when we send the joining instructions.' },
      { question: 'Visa?', answer: 'Tanzania e-visa is not included. Apply before travel. We send the official site and a photo/passport checklist.' },
      { question: 'Can I add Zanzibar?', answer: 'Not in this package. WhatsApp 0974332069 for a custom Zanzibar beach add-on after the safari.' },
    ],
    addons: [
      { name: 'Hot-air balloon (Serengeti)', description: 'Dawn balloon if the date and weather allow, paid to the operator', price: 28000 },
      { name: 'Single room', description: 'Private room/tent if the camp has space', price: 26000 },
    ],
    dates: ['2026-10-22', '2026-11-19', '2027-01-21', '2027-02-18'],
    featured: true,
    popular: true,
  })

  const [settings] = await db.select().from(siteSettings).limit(1)
  if (settings?.homepageJson) {
    const home = parseHomepageContent(settings.homepageJson)
    if (home.services[3] && home.services[3].kicker !== 'International') {
      home.services[3] = DEFAULT_HOMEPAGE.services[3]
      await db
        .update(siteSettings)
        .set({ homepageJson: JSON.stringify(home) })
        .where(eq(siteSettings.id, 'default'))
    }
  }
}
