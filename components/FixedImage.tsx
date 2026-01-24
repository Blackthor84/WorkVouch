// components/FixedImage.tsx
import Image, { ImageProps } from "next/image";

interface FixedImageProps extends ImageProps {
  fallbackSrc?: string;
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
