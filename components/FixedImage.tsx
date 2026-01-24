import Image from "next/image";
import type { ComponentProps } from "react";

// Use ComponentProps<typeof Image> instead of ImageProps
// This ensures we get all Image props including alt, width, height, etc.
export type FixedImageProps = Omit<ComponentProps<typeof Image>, "src"> & {
  src: string;           // required
  unoptimized?: boolean; // optional, default true
  loading?: "lazy" | "eager"; // optional, default eager
};

export default function FixedImage({
  src,
  unoptimized = true,
  loading = "eager",
  ...props
}: FixedImageProps) {
  return <Image src={src} unoptimized={unoptimized} loading={loading} {...props} />;
}
