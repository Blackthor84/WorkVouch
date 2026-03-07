"use client";

export default function TrustScoreGauge({ score }: { score: number }) {
  const percentage = Math.min(score, 100);

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Trust Score</h2>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
        <div
          className="bg-green-500 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>100</span>
      </div>

      <div className="text-center mt-3 text-2xl font-bold text-green-600">
        {score}
      </div>
    </div>
  );
}
