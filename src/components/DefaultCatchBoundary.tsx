import { ErrorComponent, Link, rootRouteId, useMatch, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({ strict: false, select: (s) => s.id === rootRouteId })

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <ErrorComponent error={error} />
      <div className="flex gap-3">
        <button type="button" onClick={() => router.invalidate()} className="btn-primary">
          Try again
        </button>
        {isRoot ? (
          <Link to="/" className="btn-outline">Home</Link>
        ) : (
          <button type="button" onClick={() => window.history.back()} className="btn-outline">
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
