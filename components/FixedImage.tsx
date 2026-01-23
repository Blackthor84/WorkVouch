import Image, { ImageLoaderProps } from "next/image";
import type { HTMLAttributes } from "react";

// Minimal type for FixedImage props
interface FixedImageProps extends HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loader?: (props: ImageLoaderProps) => string;
}

export default function FixedImage(props: FixedImageProps) {
  return <Image {...props} loading="eager" />;
}
