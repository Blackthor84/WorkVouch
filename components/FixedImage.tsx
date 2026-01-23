import Image, { ImageProps } from "next/image";

export default function FixedImage(props: ImageProps) {
  return <Image {...props} loading="eager" />;
}
