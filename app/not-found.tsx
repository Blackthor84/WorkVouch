import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-grey-dark dark:text-gray-200">404 - Page Not Found</h2>
        <p className="mt-4 text-grey-medium dark:text-gray-400">
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white px-5 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
