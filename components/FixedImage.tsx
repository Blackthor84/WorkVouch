// Use require to bypass module alias and get the actual Next.js Image
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Direct require to avoid module alias circular reference
const NextImage = require("next/image").default;
import type { ComponentPropsWithoutRef } from "react";

type FixedImageProps = Omit<ComponentPropsWithoutRef<typeof NextImage>, 'loading'>;

export default function FixedImage(props: FixedImageProps) {
  return (
    <NextImage
      {...props}
      loading="eager"
    />
  );
}
