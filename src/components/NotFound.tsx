import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}
