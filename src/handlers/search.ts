import { apiClient } from "../config.js";

// Cache of resolved default branches per repo (process lifetime).
const defaultBranchCache = new Map<string, string>();

/** Test-only hook to clear the default-branch cache. */
export function _resetSearchCacheForTests(): void {
  defaultBranchCache.clear();
}

async function resolveDefaultBranch(projectKey: string, repoSlug: string): Promise<string> {
  const key = `${projectKey}/${repoSlug}`;
  const cached = defaultBranchCache.get(key);
  if (cached) return cached;
  try {
    const response = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches/default`,
    );
    const id = response.data?.id;
    if (typeof id === "string" && id) {
      defaultBranchCache.set(key, id);
      return id;
    }
  } catch {
    // Fall through to heuristic below.
  }
  // Heuristic: most servers default to `main` nowadays, `master` historically.
  try {
    const branches = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/branches`,
      { params: { limit: 100 } },
    );
    const values = branches.data.values || [];
    const def = values.find((b: any) => b.isDefault) || values[0];
    if (def?.id) {
      defaultBranchCache.set(key, def.id);
      return def.id;
    }
  } catch {
    // ignore
  }
  return "refs/heads/main";
}

export async function handleSearchCode(args: {
  projectKey: string;
  repoSlug: string;
  query: string;
  limit?: number;
}) {
  const { projectKey, repoSlug, query, limit = 25 } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
    { params: { q: query, limit } },
  );
  return response.data.values || response.data;
}

/**
 * Convert a filename glob to a RegExp.
 *
 * Supports `*` (any run of non-slash chars), `**` (any chars including `/`,
 * also matching zero directories so `src/**` matches `src/file.ts`),
 * and `?` (single non-slash char).
 */
export function globToRegex(glob: string): RegExp {
  let i = 0;
  let out = "";
  const n = glob.length;
  while (i < n) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        // `**`
        if (glob[i + 2] === "/") {
          out += "(.*/)?"; // `**/` matches zero or more directories
          i += 3;
        } else {
          out += ".*";
          i += 2;
        }
      } else {
        out += "[^/]*";
        i += 1;
      }
    } else if (c === "?") {
      out += "[^/]";
      i += 1;
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${out}$`);
}

function compileQuery(query: string, caseInsensitive: boolean): RegExp {
  try {
    return new RegExp(query, caseInsensitive ? "gi" : "g");
  } catch (err: any) {
    throw new Error(`Invalid regex query: ${err?.message || err}`);
  }
}

async function fetchRawFile(
  projectKey: string,
  repoSlug: string,
  filePath: string,
  at: string,
): Promise<string | null> {
  try {
    const fileResponse = await apiClient.get(
      `/projects/${projectKey}/repos/${repoSlug}/raw/${filePath}`,
      { params: { at } },
    );
    return typeof fileResponse.data === "string" ? fileResponse.data : null;
  } catch {
    return null; // Skip binary / deleted / unreadable files.
  }
}

/** Fetch raw contents with bounded concurrency. */
async function fetchMany(
  projectKey: string,
  repoSlug: string,
  files: string[],
  at: string,
  concurrency = 8,
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const contents = await Promise.all(
      batch.map((fp) => fetchRawFile(projectKey, repoSlug, fp, at)),
    );
    batch.forEach((fp, idx) => {
      const content = contents[idx];
      if (content !== null) results.set(fp, content);
    });
  }
  return results;
}

export async function handleGrep(args: {
  projectKey: string;
  repoSlug: string;
  query: string;
  ref?: string;
  mode?: string;
  glob?: string;
  path?: string;
  context_lines?: number;
  case_insensitive?: boolean;
  max_results?: number;
  max_files?: number;
}) {
  const {
    projectKey,
    repoSlug,
    query,
    ref,
    mode = "content",
    glob,
    path: searchPath,
    context_lines = 0,
    case_insensitive = false,
    max_results = 200,
    max_files = 50,
  } = args;

  if (!["content", "files", "count"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Use 'content', 'files', or 'count'.`);
  }

  const regex = compileQuery(query, case_insensitive);
  const globRegex = glob ? globToRegex(glob) : null;
  const matchesScope = (filePath: string) => {
    if (globRegex && !globRegex.test(filePath)) return false;
    if (searchPath && !filePath.startsWith(searchPath)) return false;
    return true;
  };

  const at = ref || (await resolveDefaultBranch(projectKey, repoSlug));

  // Candidate files from Bitbucket's index-backed search.
  const searchResponse = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
    { params: { q: query, limit: Math.min(Math.max(max_results, 1), 100) } },
  );
  const candidateFiles = Array.from(
    new Set(
      ((searchResponse.data.values || []) as any[])
        .map((r: any) => (typeof r.path === "string" ? r.path : ""))
        .filter((p: string) => p && matchesScope(p)),
    ),
  ).slice(0, Math.max(max_files, 1));

  const contents = await fetchMany(projectKey, repoSlug, candidateFiles, at);

  const results: any[] = [];
  let totalMatches = 0;

  for (const [filePath, content] of contents) {
    if (totalMatches >= max_results) break;
    const lines = content.split("\n");

    if (mode === "files") {
      for (const line of lines) {
        regex.lastIndex = 0;
        if (regex.test(line)) {
          results.push({ file: filePath });
          totalMatches++;
          break;
        }
      }
      continue;
    }

    let fileCount = 0;
    const fileMatches: any[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (totalMatches >= max_results) break;
      regex.lastIndex = 0;
      if (!regex.test(lines[i])) continue;
      if (mode === "count") {
        fileCount++;
      } else {
        const match: any = { file: filePath, line: i + 1, content: lines[i].trim() };
        if (context_lines > 0) {
          const start = Math.max(0, i - context_lines);
          const end = Math.min(lines.length - 1, i + context_lines);
          match.context = lines.slice(start, end + 1).map((l: string, idx: number) => ({
            line: start + idx + 1,
            content: l,
          }));
        }
        fileMatches.push(match);
        totalMatches++;
      }
    }
    if (mode === "count" && fileCount > 0) {
      results.push({ file: filePath, matches: fileCount });
      totalMatches++;
    } else {
      results.push(...fileMatches);
    }
  }

  return { total: totalMatches, results: results.slice(0, max_results) };
}
