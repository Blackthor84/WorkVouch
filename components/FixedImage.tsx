import Image, { ImageLoaderProps } from "next/image";
import type { HTMLAttributes } from "react";

// Add `unoptimized` and `className` to the type
interface FixedImageProps extends HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loader?: (props: ImageLoaderProps) => string;
  unoptimized?: boolean;
}

export default function FixedImage(props: FixedImageProps) {
  return <Image {...props} loading="eager" />;
}
