// components/FixedImage.tsx
import Image from "next/image";
import type { ComponentProps } from "react";

// FixedImageProps — accept all Image props except src
export interface FixedImageProps extends Omit<ComponentProps<typeof Image>, "src"> {
  src: string; // make src required
  unoptimized?: boolean;
  loading?: "lazy" | "eager";
}

export default function FixedImage({ src, unoptimized = true, loading = "eager", ...props }: FixedImageProps) {
  return <Image src={src} unoptimized={unoptimized} loading={loading} {...props} />;
}
