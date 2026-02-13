import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skilled Trades | Verified Work History | WorkVouch",
  description:
    "Verified work history for skilled trades professionals. Build trust, verify experience, and stand out with peer-backed references. Electricians, plumbers, HVAC, carpenters.",
};

export default function SkilledTradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
