import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote: "WorkVouch helped us reduce hiring risk and verify experience faster.",
    attribution: "Hiring Manager, Healthcare",
    role: "Employer",
  },
  {
    quote: "Finally a way to prove my work history with real references.",
    attribution: "Registered Nurse",
    role: "Employee",
  },
  {
    quote: "We use WorkVouch to confirm tenure and get peer feedback before making offers.",
    attribution: "HR Director, Logistics",
    role: "Employer",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 bg-[#F8FAFC]" id="testimonials">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 overflow-x-hidden">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-[#64748B]">
          What people say
        </p>
        <h2 className="text-center text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl mt-2 mb-10">
          Trusted by hiring managers in high-trust industries
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="border-[#E2E8F0] bg-white">
              <CardContent className="p-6">
                <p className="text-[#334155] italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-[#0F172A]">{t.attribution}</p>
                <p className="text-xs text-[#64748B]">{t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
