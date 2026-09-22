import { createFileRoute, useRouter } from '@tanstack/react-router'
import { listPendingReviewsFn, updateReviewStatusFn } from '~/server/admin/functions'

export const Route = createFileRoute('/admin/reviews')({
  loader: async () => {
    const reviews = await listPendingReviewsFn()
    return { reviews }
  },
  component: AdminReviewsPage,
})

function AdminReviewsPage() {
  const { reviews } = Route.useLoaderData()
  const router = useRouter()

  const updateStatus = async (id: string, status: string) => {
    await updateReviewStatusFn({ data: { id, status } })
    router.invalidate()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Review Moderation</h1>
      <div className="mt-6 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Rating: {review.rating}/5</p>
                <p className="mt-2 text-muted">{review.comment}</p>
                <p className="mt-2 text-xs text-muted">Trip ID: {review.tripId}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => updateStatus(review.id, 'approved')} className="btn-primary text-sm">
                  Approve
                </button>
                <button type="button" onClick={() => updateStatus(review.id, 'rejected')} className="btn-outline text-sm">
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-muted">No pending reviews.</p>}
      </div>
    </div>
  )
}
