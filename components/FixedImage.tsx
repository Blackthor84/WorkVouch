// components/FixedImage.tsx
import Image, { ImageProps } from 'next/image';

export interface FixedImageProps extends ImageProps {
  fallbackSrc?: string; // optional fallback image if src not found
}

export default function FixedImage({ fallbackSrc, ...props }: FixedImageProps) {
  return (
    <Image
      {...props}
      onError={(e: any) => {
        if (fallbackSrc) e.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
