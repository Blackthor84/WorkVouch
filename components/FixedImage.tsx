// components/FixedImage.tsx
import Image, { ImageProps } from "next/image";

// Extend all ImageProps except src
export interface FixedImageProps extends Omit<ImageProps, "src"> {
  src: string;           // make src required
  unoptimized?: boolean; // default true
  loading?: "lazy" | "eager"; // default eager
}

export default function FixedImage({
  src,
  unoptimized = true,
  loading = "eager",
  ...props
}: FixedImageProps) {
  return <Image src={src} unoptimized={unoptimized} loading={loading} {...props} />;
}
