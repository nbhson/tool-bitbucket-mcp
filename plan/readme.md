# Plan — tool-bitbucket-mcp

Bitbucket MCP server (TypeScript), 61 tests, Dockerfile, HTTP transport (bind 127.0.0.1 mặc định — security tốt).

## Baseline audit (00:44, 28-10-2026)
- Tests: ✅ **61 pass** (9 files)
- Lint + typecheck: ✅ clean
- Trạng thái: **tốt nhất trong các repo** — cần polish nhẹ

## Roadmap
### P0
- [ ] Không có lỗi chặn

### P1 (chất lượng)
- [x] `npm audit` + cập nhật deps an toàn
  - Fix trực tiếp: `@modelcontextprotocol/sdk@1.32.2`, `axios@1.21.0`, `vitest@5.0.5`, `@vitest/coverage-v8@5.0.5`
  - `npm audit fix` bị lỗi arborist npm (Cannot read properties of null) → workaround: xoá node_modules + `npm update`
  - Kết quả: **0 vulnerabilities** (từ 17: 1 critical, 9 high, 7 moderate)
- [ ] Rà review error handling trong src/ (API error mapping, retry)
- [x] Coverage: 61/61 tests pass sau update deps (9 files, vitest 5.0.5)

### P2
- [ ] CI workflow
- [x] Docs sync version 1.5.0 (sửa test count 57 → 61 trong Project Structure; 39 tools khớp code)

## Self-review log
- _0:44_ Audit lần 1: 61/61 pass, lint clean.
- _1:40_ P2: deps updated, 0 vuln, tests/lint/build pass. README sync test count.
