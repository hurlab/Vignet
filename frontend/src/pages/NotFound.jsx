import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-teal-dark text-2xl font-semibold mb-4">404 &mdash; Page Not Found</h1>
      <p className="text-gray-500 text-sm mb-6">
        The page you requested does not exist.
      </p>
      <Link to="/" className="text-teal-dark text-sm hover:underline">
        &larr; Back to Home
      </Link>
    </div>
  )
}
