"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/navbar"), {
  ssr: false,
});

export default function MarketingClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
