// components/FixedImage.tsx
import Image from "next/image";
import type { ComponentProps } from "react";

export interface FixedImageProps extends Omit<ComponentProps<typeof Image>, "src"> {
  src: string; // make src required
  unoptimized?: boolean;
  loading?: "lazy" | "eager";
}

export default function FixedImage({ src, ...props }: FixedImageProps) {
  return <Image src={src} {...props} />;
}
