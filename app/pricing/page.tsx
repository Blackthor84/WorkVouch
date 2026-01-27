import PricingButtons from "@/components/PricingButtons";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// This is a server component that fetches prices from your API
export default async function PricingPage() {
  let prices: any[] = [];

  try {
    // Use relative URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/prices`, {
      cache: "no-store", // always get latest prices
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.prices)) {
      prices = data.prices;
    }
  } catch (err) {
    console.error("Failed to fetch prices:", err);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>WorkVouch Pricing</h1>

      {prices.length > 0 ? (
        <PricingButtons prices={prices} />
      ) : (
        <p style={{ color: "red" }}>Unable to load pricing. Please try again later.</p>
      )}
    </div>
  );
}
