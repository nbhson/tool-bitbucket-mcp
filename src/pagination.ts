import { z } from "zod";

/**
 * Shared input helpers for all handlers.
 *
 * Bitbucket Server paginates every collection with `start`/`limit` and
 * returns `{ values, size, isLastPage, nextPageStart }`. These helpers keep
 * that contract consistent across tools.
 */

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  start: z.coerce.number().int().min(0).optional(),
});

export type PaginationArgs = z.infer<typeof PaginationSchema>;

export interface PageEnvelope<T> {
  values: T[];
  size: number;
  isLastPage: boolean;
  /** Pass as `start` to fetch the next page. Absent on the last page. */
  nextPageStart?: number;
  limit: number;
  start: number;
}

const DEFAULT_LIMIT = 25;

/** Extract `start`/`limit` with safe defaults. Never throws. */
export function pageParams(
  args: PaginationArgs,
  fallbackLimit = DEFAULT_LIMIT,
): {
  limit: number;
  start: number;
} {
  const parsed = PaginationSchema.safeParse(args ?? {});
  const limit = parsed.success ? (parsed.data.limit ?? fallbackLimit) : fallbackLimit;
  const start = parsed.success ? (parsed.data.start ?? 0) : 0;
  return { limit, start };
}

/** Wrap a Bitbucket paged response in a stable envelope. */
export function toPage<T>(data: any, limit: number, start: number): PageEnvelope<T> {
  const values = (data?.values ?? []) as T[];
  const isLastPage = data?.isLastPage ?? true;
  const nextPageStart = data?.nextPageStart;
  return {
    values,
    size: data?.size ?? values.length,
    isLastPage,
    ...(isLastPage ? {} : { nextPageStart }),
    limit,
    start,
  };
}

/** JSON-schema fragment for paginated tools (spread into tool inputSchema). */
export const PAGINATION_SCHEMA_FRAGMENT = {
  limit: {
    type: "number",
    description: "Maximum number of items per page (default: 25, max: 1000)",
  },
  start: {
    type: "number",
    description: "Zero-based start index for pagination (use nextPageStart from previous response)",
  },
} as const;
