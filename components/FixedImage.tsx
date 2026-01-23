// Use require to bypass module alias and get the actual Next.js Image
const NextImage = require("next/image").default;
import type { ComponentPropsWithoutRef } from "react";

type FixedImageProps = ComponentPropsWithoutRef<typeof NextImage>;

export default function FixedImage(props: FixedImageProps) {
  return <NextImage {...props} loading="eager" />;
}
