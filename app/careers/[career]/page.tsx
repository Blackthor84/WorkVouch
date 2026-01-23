export default function CareerPage({ params }: { params: { career: string } }) {
  const career = params.career.replace(/-/g, " ");

  return (
    <div className="bg-gray-50 min-h-screen py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-700 mb-8 capitalize">
          {career} Careers
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">
              For Employers
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Verify past work history</li>
              <li>✔ Prevent bad hires</li>
              <li>✔ Conduct & performance tracking</li>
              <li>✔ Faster onboarding</li>
            </ul>
          </div>

          <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">
              For Employees
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li>✔ Build credibility</li>
              <li>✔ Store work history forever</li>
              <li>✔ Improve job opportunities</li>
              <li>✔ Track professional reputation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
