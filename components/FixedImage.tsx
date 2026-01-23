import Image, { ImageLoaderProps } from "next/image";
import type { ComponentProps } from "react";

export type FixedImageProps = Omit<ComponentProps<typeof Image>, "loading"> & {
  unoptimized?: boolean;
  loading?: "lazy" | "eager" | undefined; // explicitly add loading
};

export default function FixedImage({
  loading = "eager",
  unoptimized = false,
  ...rest
}: FixedImageProps) {
  return <Image {...rest} loading={loading} unoptimized={unoptimized} />;
}
