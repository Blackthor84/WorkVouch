import Link from "next/link";

export default function EmployeeSubscribe() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">WorkVouch for Workers – Always Free</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
        WorkVouch is always free for workers. You can:
      </p>
      <ul className="list-disc ml-6 mb-6 space-y-2 text-gray-700 dark:text-gray-300">
        <li>Create your profile</li>
        <li>Verify your work history</li>
        <li>Contact peers</li>
        <li>View verified coworkers</li>
      </ul>
      <p className="mb-6 font-semibold text-lg text-gray-900 dark:text-gray-100">
        No payments are required to use WorkVouch as a worker.
      </p>
      <Link href="/auth/signup">
        <button className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition-colors">
          Get Started Free
        </button>
      </Link>
    </div>
  );
}
