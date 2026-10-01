import { useRouterState } from '@tanstack/react-router'
import { useEffect, useLayoutEffect } from 'react'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/** Survives React re-renders that reset the data-reveal attribute back to "". */
const revealMemory = new WeakMap<HTMLElement, 'wait' | 'shown'>()

function byDocumentOrder(a: HTMLElement, b: HTMLElement) {
  if (a === b) return 0
  const pos = a.compareDocumentPosition(b)
  return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
}

function isHidden(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  return rect.width === 0 && rect.height === 0
}

function inFirstView(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = window.innerWidth
  return rect.bottom > vh * 0.08 && rect.top < vh * 0.84 && rect.right > 0 && rect.left < vw
}

function stamp(el: HTMLElement, mode: 'in' | 'shown' | 'wait', index: number, stagger: boolean) {
  if (stagger && mode === 'in') el.style.setProperty('--reveal-i', String(Math.min(index, 6)))
  else el.style.removeProperty('--reveal-i')
  revealMemory.set(el, mode === 'in' ? 'shown' : mode)
  if (el.getAttribute('data-reveal') !== mode) el.setAttribute('data-reveal', mode)
}

function restoreReveal(el: HTMLElement) {
  const memory = revealMemory.get(el)
  if (!memory) return false
  const current = el.getAttribute('data-reveal')
  if (current === 'in' && memory === 'shown') return true
  if (current !== memory) el.setAttribute('data-reveal', memory)
  return true
}

/**
 * One observer for [data-reveal] inside the public main column.
 * Content already on screen rides the page fade. The rest fades in once.
 */
export function SiteMotion() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useIsoLayoutEffect(() => {
    const root = document.querySelector('main.site-main')
    if (!(root instanceof HTMLElement)) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const revealHits = (hits: HTMLElement[]) => {
      const groups = new Map<HTMLElement | null, HTMLElement[]>()
      for (const el of hits) {
        if (el.getAttribute('data-reveal') !== 'wait') continue
        const parent = el.parentElement
        const key = parent?.hasAttribute('data-reveal-stagger') ? parent : null
        const list = groups.get(key) ?? []
        list.push(el)
        groups.set(key, list)
      }
      for (const [parent, list] of groups) {
        list.sort(byDocumentOrder)
        list.forEach((el, index) => stamp(el, 'in', index, Boolean(parent)))
      }
    }

    const arm = () => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
      for (const el of nodes) restoreReveal(el)
      const pending = nodes.filter((el) => {
        const state = el.getAttribute('data-reveal')
        return state !== 'in' && state !== 'shown' && state !== 'wait'
      })
      const measured = pending.map((el) => ({ el, hidden: isHidden(el) }))
      const groups = new Map<HTMLElement | null, HTMLElement[]>()

      for (const { el, hidden } of measured) {
        if (hidden) continue
        const parent = el.parentElement
        const key = parent?.hasAttribute('data-reveal-stagger') ? parent : null
        const list = groups.get(key) ?? []
        list.push(el)
        groups.set(key, list)
      }

      const waiting: HTMLElement[] = []
      for (const [parent, list] of groups) {
        list.sort(byDocumentOrder)
        if (motion.matches) {
          list.forEach((el) => stamp(el, 'shown', 0, false))
          continue
        }
        const entering: HTMLElement[] = []
        for (const el of list) {
          if (el.getAttribute('data-reveal') === 'wait') {
            waiting.push(el)
            continue
          }
          if (inFirstView(el)) stamp(el, 'shown', 0, false)
          else entering.push(el)
        }
        entering.forEach((el) => {
          stamp(el, 'wait', 0, Boolean(parent))
          waiting.push(el)
        })
      }
      return waiting
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hits: HTMLElement[] = []
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target
          if (el instanceof HTMLElement) hits.push(el)
          io.unobserve(entry.target)
        }
        revealHits(hits)
      },
      { root: null, rootMargin: '0px 0px -32px 0px', threshold: 0.01 },
    )

    const watch = () => {
      arm()
      root.querySelectorAll<HTMLElement>('[data-reveal="wait"]').forEach((el) => io.observe(el))
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        watch()
      })
    }

    const onFocusIn = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const el = target.closest<HTMLElement>('[data-reveal="wait"]')
      if (!el || !root.contains(el)) return
      stamp(el, 'shown', 0, false)
      io.unobserve(el)
    }

    const onMotionChange = () => {
      if (!motion.matches) return
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => stamp(el, 'shown', 0, false))
      io.disconnect()
    }

    watch()
    const mo = new MutationObserver(schedule)
    mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-reveal'],
    })
    root.addEventListener('focusin', onFocusIn)
    motion.addEventListener('change', onMotionChange)
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      io.disconnect()
      mo.disconnect()
      root.removeEventListener('focusin', onFocusIn)
      motion.removeEventListener('change', onMotionChange)
      window.removeEventListener('resize', schedule)
    }
  }, [pathname])

  return null
}
