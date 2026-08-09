export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 gap-3">
      <div aria-hidden="true" className="w-8 h-8 border-4 border-teal-200 border-t-teal-dark rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
