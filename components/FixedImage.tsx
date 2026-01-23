import Image from "next/image";
import type { ComponentProps } from "react";

// FixedImageProps — simple and compatible with Next.js 16+
export type FixedImageProps = ComponentProps<typeof Image> & {
  unoptimized?: boolean;
};

export default function FixedImage({
  unoptimized = false,
  ...rest
}: FixedImageProps) {
  return <Image {...rest} unoptimized={unoptimized} />;
}
