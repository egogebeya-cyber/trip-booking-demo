import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { CANCELLATION_FAQ_ANSWER, LEGAL_PAGES } from '~/lib/legal-content'
import { db } from './index'
import { legalPages, siteFaqs } from './schema'

function isStubBody(body: string) {
  const text = body.replace(/<[^>]+>/g, '').trim()
  if (text.length < 400) return true
  if (/coming soon/i.test(text)) return true
  if (/we respect your privacy/i.test(text)) return true
  if (/by using our website, you agree/i.test(text)) return true
  return false
}

export async function ensureLegalPages() {
  for (const page of LEGAL_PAGES) {
    const [existing] = await db.select().from(legalPages).where(eq(legalPages.slug, page.slug)).limit(1)
    if (!existing) {
      await db.insert(legalPages).values({
        id: nanoid(),
        slug: page.slug,
        title: page.title,
        body: page.body,
      })
      continue
    }
    if (isStubBody(existing.body)) {
      await db
        .update(legalPages)
        .set({ title: page.title, body: page.body, updatedAt: new Date() })
        .where(eq(legalPages.slug, page.slug))
    }
  }

  const faqs = await db.select().from(siteFaqs)
  const cancellationFaq = faqs.find((faq) => /cancellation policy/i.test(faq.question))
  if (cancellationFaq && cancellationFaq.answer.length < 200) {
    await db
      .update(siteFaqs)
      .set({ answer: CANCELLATION_FAQ_ANSWER })
      .where(eq(siteFaqs.id, cancellationFaq.id))
  }
}
