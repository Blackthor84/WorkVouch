export default function CareerPage({ params }: { params: { career: string } }) {
  const career = params.career;
  return (
    <div className="bg-gray-50 min-h-screen py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8 capitalize">{career}</h1>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">For Employers</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Verify past work history</li>
              <li>✔ Performance notes</li>
              <li>✔ Background + behavior checks</li>
              <li>✔ Faster hiring decisions</li>
            </ul>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">For Employees</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Verified work history</li>
              <li>✔ Proof of performance</li>
              <li>✔ Portable personal record</li>
              <li>✔ Better job opportunities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
