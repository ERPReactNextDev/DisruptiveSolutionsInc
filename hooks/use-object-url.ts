"use client";

import * as React from "react";

/**
 * Creates an object URL for a `File`/`Blob` and revokes it on change/unmount.
 *
 * Use this instead of calling `URL.createObjectURL()` inline during render —
 * that leaks the underlying blob for the lifetime of the page.
 *
 * @param file the file to preview, or `null`/`undefined` to clear
 * @returns the object URL string, or `null` when there is nothing to preview
 */
export function useObjectUrl(file: Blob | null | undefined): string | null {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}