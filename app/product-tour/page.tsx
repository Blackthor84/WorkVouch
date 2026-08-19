import type { Metadata } from "next";
import { ProductTourClient } from "@/components/product-tour/ProductTourClient";

export const metadata: Metadata = {
  title: "Product Tour | WorkVouch",
  description:
    "See WorkVouch in action — from employee Career Passport and coworker Vouches to employer search and profile review.",
  robots: { index: true, follow: true },
};

export default function ProductTourPage() {
  return <ProductTourClient />;
}
