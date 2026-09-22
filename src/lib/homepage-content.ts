export type HomepageFeature = { title: string; desc: string }
export type HomepageService = { kicker: string; title: string; desc: string }

export type HomepageContent = {
  heroKicker: string
  aboutKicker: string
  aboutTitle: string
  aboutFallback: string
  features: HomepageFeature[]
  servicesKicker: string
  servicesTitle: string
  servicesDesc: string
  services: HomepageService[]
  futureKicker: string
  futureTitle: string
  popularKicker: string
  teamKicker: string
  teamTitle: string
  galleryKicker: string
  galleryTitle: string
  blogKicker: string
  newsletterTitle: string
  newsletterDesc: string
  testimonialsKicker: string
  contactKicker: string
  contactTitle: string
  contactDesc: string
  contactFormTitle: string
  heroImages: string[]
  galleryImages: string[]
}

export const DEFAULT_HOMEPAGE: HomepageContent = {
  heroKicker: 'Premium trip experience',
  aboutKicker: 'About us',
  aboutTitle: 'Our travel journey',
  aboutFallback:
    'We create group trips from Addis Ababa — one-day and two-day Ethiopia adventures, plus international packages to Dubai, Kenya, and Tanzania.',
  features: [
    { title: 'Expert guides', desc: 'Local guides who know the routes, culture, and hidden viewpoints.' },
    { title: 'All-inclusive offers', desc: 'Transport, lunch, entrance, and water are included in the trip price.' },
    { title: 'Group community', desc: 'Travel with friends. Groups of 5+ get 5% off, and 10+ get 10% off.' },
  ],
  servicesKicker: 'Our services',
  servicesTitle: 'What we offer',
  servicesDesc: 'Trip packages made for day trips, weekends, groups, and upcoming dates.',
  services: [
    { kicker: '1 Day Trip', title: 'Same-day adventure', desc: 'Leave and return the same day. Transport, guide, entrance, lunch, water.' },
    { kicker: '2 Days Trip', title: 'Overnight escape', desc: 'Stay overnight with dinner, breakfast, lodging, guide, and transport.' },
    { kicker: 'Group trips', title: 'Friends & offices', desc: 'Book 5+ guests for 5% off, or 10+ for 10% off automatically.' },
    { kicker: 'International', title: 'Dubai, Kenya, Tanzania', desc: 'Multi-day group packages from Addis — flights, hotels, and guided days included.' },
  ],
  futureKicker: 'Calendar',
  futureTitle: 'Future trips',
  popularKicker: 'Popular',
  teamKicker: 'Our team',
  teamTitle: 'Expert guides',
  galleryKicker: 'Gallery',
  galleryTitle: 'Trips in action',
  blogKicker: 'Latest news',
  newsletterTitle: 'Stay updated',
  newsletterDesc: 'Subscribe for trip dates, offers, and discounts. Chat with us on WhatsApp or Telegram anytime.',
  testimonialsKicker: 'Testimonials',
  contactKicker: 'Contact us',
  contactTitle: 'Get in touch',
  contactDesc: 'Send a message or chat with us on WhatsApp and Telegram.',
  contactFormTitle: 'Send us a message',
  heroImages: [],
  galleryImages: [],
}

export function parseHomepageContent(json?: string | null): HomepageContent {
  if (!json) return DEFAULT_HOMEPAGE
  try {
    const parsed = JSON.parse(json) as Partial<HomepageContent>
    return {
      ...DEFAULT_HOMEPAGE,
      ...parsed,
      features: parsed.features?.length === 3 ? parsed.features : DEFAULT_HOMEPAGE.features,
      services: parsed.services?.length === 4 ? parsed.services : DEFAULT_HOMEPAGE.services,
      heroImages: parsed.heroImages ?? DEFAULT_HOMEPAGE.heroImages,
      galleryImages: parsed.galleryImages ?? DEFAULT_HOMEPAGE.galleryImages,
    }
  } catch {
    return DEFAULT_HOMEPAGE
  }
}
