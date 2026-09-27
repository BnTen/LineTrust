import { describe, expect, it, afterEach } from "vitest";
import { isDataPublic, robotsPolicy } from "@/lib/seo";

describe("seo / DATA_PUBLIC gate", () => {
  const prev = process.env.DATA_PUBLIC;

  afterEach(() => {
    if (prev === undefined) delete process.env.DATA_PUBLIC;
    else process.env.DATA_PUBLIC = prev;
  });

  it("defaults to noindex when DATA_PUBLIC is unset or false", () => {
    delete process.env.DATA_PUBLIC;
    expect(isDataPublic()).toBe(false);
    expect(robotsPolicy()).toEqual({ index: false, follow: false });

    process.env.DATA_PUBLIC = "false";
    expect(isDataPublic()).toBe(false);
    expect(robotsPolicy()).toEqual({ index: false, follow: false });
  });

  it("allows index only when DATA_PUBLIC is exactly true", () => {
    process.env.DATA_PUBLIC = "true";
    expect(isDataPublic()).toBe(true);
    expect(robotsPolicy()).toEqual({ index: true, follow: true });
  });
});
