import { apiClient } from "../config.js";

export async function handleSearchCode(args: {
  projectKey: string;
  repoSlug: string;
  query: string;
}) {
  const { projectKey, repoSlug, query } = args;
  const response = await apiClient.get(
    `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
    { params: { q: query } }
  );
  return response.data.values || response.data;
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
  } = args;

  const at = ref || "refs/heads/master";

  // Step 1: If glob or path provided, narrow down the file list via browse API
  let filePaths: string[] = [];

  if (glob || searchPath) {
    const searchResponse = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
      { params: { q: "", type: "file", context: searchPath || "", limit: 500 } }
    );
    filePaths = (searchResponse.data.values || [])
      .map((r: any) => (typeof r.path === "string" ? r.path : ""))
      .filter((p: string) => p);
  }

  // Step 2: Build the regex
  const flags = case_insensitive ? "gi" : "g";
  const regex = new RegExp(query, flags);

  const results: any[] = [];
  let totalMatches = 0;

  // Helper: convert glob to simple regex
  const globToRegex = (g: string): RegExp => {
    const escaped = g
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]");
    return new RegExp(`^${escaped}$`);
  };

  const globRegex = glob ? globToRegex(glob) : null;

  // Helper: search a single file content
  const searchFileContent = (filePath: string, content: string) => {
    if (max_results > 0 && totalMatches >= max_results) return;

    // Apply glob filter
    if (globRegex && !globRegex.test(filePath)) return;

    // Apply path filter
    if (searchPath && !filePath.startsWith(searchPath)) return;

    const lines = content.split("\n");
    const fileMatches: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      regex.lastIndex = 0;
      if (regex.test(line)) {
        if (mode === "files") {
          if (!results.find((r: any) => r.file === filePath)) {
            results.push({ file: filePath });
            totalMatches++;
          }
          break;
        }

        if (mode === "count") {
          fileMatches.push({ line: i + 1 });
        } else {
          // content mode with context
          const match: any = { file: filePath, line: i + 1, content: line.trim() };
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

        if (max_results > 0 && totalMatches >= max_results) break;
      }
    }

    if (mode === "count" && fileMatches.length > 0) {
      results.push({ file: filePath, matches: fileMatches.length });
    } else if (mode === "content") {
      results.push(...fileMatches);
    }
  };

  if (filePaths.length > 0) {
    // Search specific files
    for (const fp of filePaths) {
      if (max_results > 0 && totalMatches >= max_results) break;
      try {
        const fileResponse = await apiClient.get(
          `/projects/${projectKey}/repos/${repoSlug}/raw/${fp}`,
          { params: { at } }
        );
        if (typeof fileResponse.data === "string") {
          searchFileContent(fp, fileResponse.data);
        }
      } catch {
        // Skip files that can't be read (binary, deleted, etc.)
      }
    }
  } else {
    // Broad search: use Bitbucket's search API to find files containing the term
    const searchResponse = await apiClient.get(
      `/rest/api/1.0/projects/${projectKey}/repos/${repoSlug}/search`,
      { params: { q: query, limit: Math.min(max_results, 100) } }
    );
    const searchResults = searchResponse.data.values || [];

    // Group by file and get content for each
    const filesToFetch = new Set<string>();
    for (const result of searchResults) {
      if (max_results > 0 && totalMatches >= max_results) break;
      const filePath = result.path || "";
      if (!filePath) continue;
      if (globRegex && !globRegex.test(filePath)) continue;
      if (searchPath && !filePath.startsWith(searchPath)) continue;
      filesToFetch.add(filePath);
    }

    for (const fp of filesToFetch) {
      if (max_results > 0 && totalMatches >= max_results) break;
      try {
        const fileResponse = await apiClient.get(
          `/projects/${projectKey}/repos/${repoSlug}/raw/${fp}`,
          { params: { at } }
        );
        if (typeof fileResponse.data === "string") {
          searchFileContent(fp, fileResponse.data);
        }
      } catch {
        // Skip files that can't be read
      }
    }

    // Also add files found by search that weren't content-matched
    if (mode === "files") {
      for (const result of searchResults) {
        if (totalMatches >= max_results) break;
        const filePath = result.path || "";
        if (!filePath) continue;
        if (globRegex && !globRegex.test(filePath)) continue;
        if (searchPath && !filePath.startsWith(searchPath)) continue;
        if (!results.find((r: any) => r.file === filePath)) {
          results.push({ file: filePath });
          totalMatches++;
        }
      }
    }
  }

  return { total: totalMatches, results: results.slice(0, max_results) };
}