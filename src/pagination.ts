import { z } from "zod";

/**
 * Shared input helpers for all handlers.
 *
 * Bitbucket Server paginates every collection with `start`/`limit` and
 * returns `{ values, size, isLastPage, nextPageStart }`. These helpers keep
 * that contract consistent across tools.
 */

export const PaginationSchema = z
  .object({
    limit: z.coerce
      .number({ message: "limit must be a number" })
      .int("limit must be an integer")
      .min(1, "limit must be at least 1")
      .max(1000, "limit must be at most 1000")
      .optional(),
    start: z.coerce
      .number({ message: "start must be a number" })
      .int("start must be an integer")
      .min(0, "start must be non-negative")
      .optional(),
  })
  .strict();

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

/**
 * Extract `start`/`limit` with safe defaults. Never throws.
 *
 * @param args - Raw pagination arguments from the MCP tool call
 * @param fallbackLimit - Default limit when not specified (default: 25)
 * @returns Object containing validated `limit` and `start` values
 */
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

/**
 * Wrap a Bitbucket paged response in a stable envelope.
 *
 * @param data - Raw Bitbucket API response data
 * @param limit - Requested page size
 * @param start - Requested start index
 * @returns Normalized page envelope with values, size, isLastPage, nextPageStart
 */
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
