import Image from "next/image";
import type { ComponentProps } from "react";

// Use ComponentProps<typeof Image> to get the props type
type NextImageProps = ComponentProps<typeof Image>;

export default function FixedImage(props: NextImageProps) {
  return <Image {...props} loading="eager" />;
}
