/**
 * Normalize a Bitbucket path value to a plain string.
 *
 * Depending on the API endpoint and server version, path-like fields are
 * either a plain `string` or a `RestPath` object whose `toString` property
 * is a string (e.g. `{ components: [...], toString: "src/main.ts" }`).
 * Reading `.toString` directly returns the method itself when the value is
 * a plain string, which would then be silently dropped by `JSON.stringify`.
 */
export function normalizePathString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const asObject = value as { toString?: unknown; name?: unknown };
    if (typeof asObject.toString === "string") return asObject.toString;
    if (typeof asObject.name === "string") return asObject.name;
  }
  return null;
}
