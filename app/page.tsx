"use client";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10">
      <h1 className="text-5xl font-bold mb-6">WorkVouch</h1>
      <p className="text-xl text-gray-600 text-center max-w-xl">
        Your deployment is successful. The homepage is now working.
      </p>

      <div className="mt-10 flex gap-4">
        <a
          href="/auth/signup"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Sign Up
        </a>
        <a
          href="/auth/signin"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg shadow hover:bg-black"
        >
          Login
        </a>
      </div>
    </main>
  );
}
