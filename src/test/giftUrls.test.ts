import { describe, expect, it } from "vitest";
import { giftUrls, giftUrlPayload } from "@/lib/giftUrls";

describe("gift links", () => {
  it("prefers urls and falls back to the legacy link only when empty", () => {
    expect(giftUrls({ urls: ["https://new.example"], url: "https://old.example" })).toEqual(["https://new.example"]);
    expect(giftUrls({ urls: [], url: "https://old.example" })).toEqual(["https://old.example"]);
  });
  it("discards empty rows and writes the first link to the legacy column", () => {
    expect(giftUrlPayload([" ", " https://one.example ", "https://two.example", ""])).toEqual({ urls: ["https://one.example", "https://two.example"], url: "https://one.example" });
    expect(giftUrlPayload([""])).toEqual({ urls: [], url: null });
  });
  it("accepts ten links but refuses eleven", () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://example.com/${i}`);
    expect(giftUrlPayload(urls).urls).toHaveLength(10);
    expect(() => giftUrlPayload([...urls, "https://extra.example"])).toThrow();
  });
});