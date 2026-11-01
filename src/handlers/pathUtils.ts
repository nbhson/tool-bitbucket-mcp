/**
 * Normalize a Bitbucket path value to a plain string.
 *
 * Depending on the API endpoint and server version, path-like fields are
 * either a plain `string` or a `RestPath` object whose `toString` property
 * is a string (e.g. `{ components: [...], toString: "src/main.ts" }`).
 * Reading `.toString` directly returns the method itself when the value is
 * a plain string, which would then be silently dropped by `JSON.stringify`.
 */
/**
 * Encode một path segment (projectKey, repoSlug, commitId, ...) để nhúng an
 * toàn vào URL. Bắt buộc vì các giá trị này đến từ LLM/clients và có thể chứa
 * ký tự đặc biệt (`/`, `?`, `#`, `%`, khoảng trắng, ...) phá vỡ cấu trúc URL.
 */
export function encSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

/**
 * Encode từng segment của một đường dẫn file, giữ nguyên dấu `/` ngăn cách.
 *
 * Dùng cho raw-file/browse URL: không thể encodeURIComponent cả chuỗi vì
 * Bitbucket API yêu cầu `/` giữ nguyên trong path, nhưng từng segment cần
 * encode (khoảng trắng, `#`, `+`, `%`, ký tự unicode, ...).
 */
export function encFilePath(filePath: string): string {
  return filePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join("/");
}

export function normalizePathString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const asObject = value as { toString?: unknown; name?: unknown };
    if (typeof asObject.toString === "string") return asObject.toString;
    if (typeof asObject.name === "string") return asObject.name;
  }
  return null;
}
