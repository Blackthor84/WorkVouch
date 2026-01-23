// components/FixedImage.tsx
import Image, { ImageProps } from 'next/image';

export interface FixedImageProps extends Omit<ImageProps, 'src'> {
  src: string; // make src required
  fallbackSrc?: string; // optional fallback image
}

export default function FixedImage({ src, fallbackSrc, ...props }: FixedImageProps) {
  return (
    <Image
      {...props}
      src={src}
      onError={(e: any) => {
        if (fallbackSrc) e.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
