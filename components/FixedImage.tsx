import Image, { ImageProps as NextImageProps } from "next/image";

export default function FixedImage(props: NextImageProps) {
  return <Image {...props} loading="eager" />;
}
