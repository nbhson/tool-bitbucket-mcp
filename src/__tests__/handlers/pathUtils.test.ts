import { describe, it, expect } from "vitest";
import { encFilePath, encSegment } from "../../handlers/pathUtils.js";

describe("encSegment", () => {
  it("giữ nguyên giá trị an toàn (alphanumeric, -, _, ~)", () => {
    expect(encSegment("PROJ")).toBe("PROJ");
    expect(encSegment("my-repo_slug~1")).toBe("my-repo_slug~1");
  });

  it("encode ký tự đặc biệt phá vỡ cấu trúc URL", () => {
    expect(encSegment("a b")).toBe("a%20b");
    expect(encSegment("a/b")).toBe("a%2Fb");
    expect(encSegment("a?b")).toBe("a%3Fb");
    expect(encSegment("a#b")).toBe("a%23b");
    expect(encSegment("50%")).toBe("50%25");
    expect(encSegment("a&b=c")).toBe("a%26b%3Dc");
  });

  it("chấp nhận số (commitId, pullRequestId)", () => {
    expect(encSegment(42)).toBe("42");
  });
});

describe("encFilePath", () => {
  it("giữ nguyên dấu / ngăn cách", () => {
    expect(encFilePath("src/main.ts")).toBe("src/main.ts");
  });

  it("encode từng segment nhưng không encode /", () => {
    expect(encFilePath("src/my file/main.ts")).toBe("src/my%20file/main.ts");
    expect(encFilePath("docs/q&a/report#1.md")).toBe("docs/q%26a/report%231.md");
    expect(encFilePath("100%/file name.txt")).toBe("100%25/file%20name.txt");
  });

  it("loại bỏ segment rỗng (dấu / thừa)", () => {
    expect(encFilePath("/src//main.ts")).toBe("src/main.ts");
  });
});
