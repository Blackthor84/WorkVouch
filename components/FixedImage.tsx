'use client';

import Image, { ImageProps } from 'next/image';

// We omit "src" because we want it required in our props
export interface FixedImageProps extends Omit<ImageProps, 'src'> {
  src: string; // make src required
  alt: string; // make alt required
}

export default function FixedImage({ src, alt, ...props }: FixedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      // optional defaults for performance
      placeholder="blur"
      blurDataURL="/placeholder.png"
      loading="lazy"
    />
  );
}
