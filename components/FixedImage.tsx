import Image from "next/image";
import type { HTMLAttributes } from "react";

// Props for FixedImage
interface FixedImageProps extends HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  unoptimized?: boolean;
  loader?: (params: { src: string; width: number }) => string;
}

export default function FixedImage(props: FixedImageProps) {
  return <Image {...props} loading="eager" />;
}
