import Image from "next/image";
import type { ComponentProps } from "react";

// Define props for FixedImage, adding unoptimized and loading manually
export type FixedImageProps = Omit<ComponentProps<typeof Image>, "loading"> & {
  unoptimized?: boolean;
  loading?: "lazy" | "eager" | undefined;
};

export default function FixedImage({
  loading = "eager",
  unoptimized = false,
  ...rest
}: FixedImageProps) {
  return <Image {...rest} loading={loading} unoptimized={unoptimized} />;
}
