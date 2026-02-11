import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    quote: "WorkVouch helped us reduce hiring risk and verify experience faster.",
    attribution: "Hiring Manager, Healthcare",
  },
  {
    quote: "Finally a way to prove my work history with real references.",
    attribution: "Registered Nurse",
  },
  {
    quote: "We use WorkVouch to confirm tenure and get peer feedback before making offers.",
    attribution: "HR Director, Logistics",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16" id="testimonials">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl mb-10">
          Trusted by hiring managers in high-trust industries
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <p className="text-slate-700 dark:text-slate-200 italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">– {t.attribution}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
