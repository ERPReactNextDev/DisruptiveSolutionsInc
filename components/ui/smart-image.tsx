import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

type SmartImageProps = Omit<ImageProps, "src" | "alt" | "fill"> & {
  /** May be `null`/empty — a placeholder is rendered instead of a broken image. */
  src?: string | null;
  /** Required. Pass `""` for decorative images, otherwise describe the image. */
  alt: string;
  /**
   * Stretch to fill the nearest sized ancestor. Renders its own `relative`
   * wrapper so the parent does not need `position: relative`.
   */
  fill?: boolean;
  /** Classes for the `fill` wrapper element. */
  wrapperClassName?: string;
  /** Rendered when `src` is missing or fails to load. */
  fallback?: React.ReactNode;
};

/** next/image cannot optimize these schemes, so they bypass the optimizer. */
function needsUnoptimized(src: string): boolean {
  return src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("file:");
}

const FALLBACK_ICON =
  "size-8 h-8 w-8 text-current opacity-25 sm:size-10 sm:h-10 sm:w-10";

function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      data-slot="smart-image-fallback"
      className={cn(
        "flex size-full items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        className,
      )}
    >
      <ImageOff className={FALLBACK_ICON} aria-hidden="true" />
    </div>
  );
}

/**
 * A drop-in replacement for `<img>` that:
 *  - routes through `next/image` (AVIF/WebP, lazy loading, no CLS)
 *  - never renders a broken image icon — missing or failed sources show a
 *    neutral placeholder instead
 *  - requires `alt`, which keeps images accessible
 *
 * Sizing:
 *  - pass `width` + `height` for intrinsically sized images (logos, avatars)
 *  - pass `fill` for images that should stretch inside a sized parent
 *  - pass neither and it behaves like `fill` with a `w-full h-full` wrapper,
 *    which matches the `className="w-full h-full object-cover"` pattern
 */
export function SmartImage({
  src,
  alt,
  className,
  fill,
  wrapperClassName,
  fallback,
  width,
  height,
  unoptimized,
  onError,
  ...props
}: SmartImageProps) {
  const [failed, setFailed] = React.useState(false);

  // Reset the error state when the source changes, otherwise a failed image
  // stays blanked out forever even after the src is swapped.
  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const usableSrc = typeof src === "string" && src.trim().length > 0 ? src : null;

  if (!usableSrc || failed) {
    return <>{fallback ?? <ImageFallback />}</>;
  }

  const image = (
    <Image
      src={usableSrc}
      alt={alt}
      className={className}
      fill={fill}
      width={fill ? undefined : (width ?? 100)}
      height={fill ? undefined : (height ?? 100)}
      unoptimized={unoptimized ?? needsUnoptimized(usableSrc)}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );

  if (fill) {
    return (
      <div
        data-slot="smart-image"
        className={cn("relative size-full overflow-hidden", wrapperClassName)}
      >
        {image}
      </div>
    );
  }

  // No explicit dimensions and no `fill`: stretch to the parent by default so
  // the common `w-full h-full object-*` pattern keeps working unchanged.
  if (width === undefined && height === undefined) {
    return (
      <div
        data-slot="smart-image"
        className={cn("relative size-full overflow-hidden", wrapperClassName)}
      >
        <Image
          src={usableSrc}
          alt={alt}
          className={className}
          fill
          unoptimized={unoptimized ?? needsUnoptimized(usableSrc)}
          onError={(event) => {
            setFailed(true);
            onError?.(event);
          }}
          {...props}
        />
      </div>
    );
  }

  return image;
}

export { ImageFallback };