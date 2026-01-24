import { careers } from '../../../data/careers';
import { Ad } from '../../../types/ad';
import AdBanner from '../../../components/AdBanner';

interface Params {
  params: { career: string };
}

async function getAds(): Promise<Ad[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/ads`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching ads:', error);
    return [];
  }
}

export default async function CareerPage({ params }: Params) {
  const career = careers.find((c) => c.id === params.career);

  if (!career) {
    return <p className="text-center mt-10">Career not found.</p>;
  }

  // Fetch ads
  const ads = await getAds();

  // Filter ads for this career
  const targetedAds = ads.filter(
    (ad) =>
      ad.isActive &&
      (ad.careers?.includes(params.career) || !ad.careers || ad.careers.length === 0)
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{career.name}</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          Why Employees Should Use WorkVouch
        </h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployees.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          Why Employers Should Use WorkVouch
        </h2>
        <ul className="list-disc pl-6">
          {career.whyForEmployers.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
        </ul>
      </section>

      {/* Targeted Ads */}
      {targetedAds.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Sponsored</h2>
          <div className="space-y-4">
            {targetedAds.map((ad) => (
              <AdBanner key={ad.id} ad={ad} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
