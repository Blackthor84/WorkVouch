'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200">Something went wrong!</h2>
        <p className="mt-4 text-grey-medium dark:text-gray-400">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-5 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
