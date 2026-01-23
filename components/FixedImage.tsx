// FIXED IMAGE COMPONENT FOR WORKVOUCH
// This version avoids TypeScript circular reference errors, works with Next.js 16+, and handles missing images gracefully.

import Image from "next/image";
import type { ComponentProps } from "react";

export type FixedImageProps = ComponentProps<typeof Image> & {
  fallbackSrc?: string; // optional fallback image if src not found
};

export default function FixedImage({
  src,
  alt,
  fallbackSrc = "/placeholder.png", // add a placeholder in public folder
  ...props
}: FixedImageProps) {
  // Check if src exists (simple runtime check)
  const finalSrc = src || fallbackSrc;

  return (
    <Image
      src={finalSrc}
      alt={alt}
      {...props}
      loading="lazy"
      unoptimized={props.unoptimized ?? true} // keep unoptimized for local/public images
      placeholder="blur"
      blurDataURL="/placeholder.png" // optional tiny placeholder blur
    />
  );
}
