import { Card, CardContent } from "@/components/ui/card";

export default function RealExampleSection() {
  return (
    <section className="bg-[#F8FAFC] border-y border-[#E2E8F0] py-16" id="see-how-it-works">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl mb-10">
          See How It Works
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Card className="flex-shrink-0 w-full md:max-w-sm border-[#E2E8F0] bg-white">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-1">Example profile</p>
              <h3 className="text-xl font-bold text-[#0F172A]">Sarah Thompson</h3>
              <p className="text-[#334155] mt-1">Healthcare</p>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Reputation Score</dt>
                  <dd className="font-semibold text-[#0F172A]">87</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Verified Jobs</dt>
                  <dd className="font-semibold text-[#0F172A]">4</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Peer References</dt>
                  <dd className="font-semibold text-[#0F172A]">6</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Rehire Eligible</dt>
                  <dd className="font-semibold text-[#0F172A]">Yes</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">
              Why this matters to employers
            </h3>
            <p className="text-[#334155] leading-relaxed">
              This score reflects verified job overlap, peer confirmation, reference quality, and profile strength. You see real data, not just claims.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
