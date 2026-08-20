/** Parse Harvest V3 cursor pagination Link header (RFC 5988). */

/** Returns the absolute URL for `rel="next"`, or null when pagination is complete. */
export function parseLinkHeaderNext(linkHeader: string | undefined | null): string | null {
  if (!linkHeader?.trim()) return null;

  const segments = linkHeader.split(",");
  for (const segment of segments) {
    const trimmed = segment.trim();
    const match = trimmed.match(/<([^>]+)>;\s*rel="next"/i);
    if (match?.[1]) return match[1];
  }

  return null;
}
