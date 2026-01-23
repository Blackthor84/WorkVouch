import Image, { ImageProps } from "next/image";
import type { HTMLAttributes } from "react";

// Define props for your FixedImage component
interface FixedImageProps extends HTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loader?: (props: { src: string; width: number }) => string; // updated type
  unoptimized?: boolean;
}

export default function FixedImage(props: FixedImageProps) {
  return <Image {...props} loading="eager" />;
}
