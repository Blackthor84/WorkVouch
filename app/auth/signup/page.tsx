import { SignUpForm } from '@/components/sign-up-form'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <NavbarServer />
      <main className="flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">Create your account</h1>
            <p className="text-grey-dark dark:text-gray-300 font-semibold">Start building your professional reputation</p>
          </div>
          <Card>
            <div className="p-8">
              <SignUpForm />
              <div className="mt-6 text-center">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

