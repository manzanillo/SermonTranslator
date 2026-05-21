import { describe, expect, it } from "vitest";
import { formatTranscript } from "./formatTranscript";

describe("formatTranscript", () => {
  it("formats normal text by trimming and collapsing spaces", () => {
    const input = "  Hello   world  from   Vitest  ";
    expect(formatTranscript(input)).toBe("Hello world from Vitest");
  });

  it("returns an empty string when given an empty string", () => {
    expect(formatTranscript("")).toBe("");
  });

  it("throws when the input is not a string", () => {
    expect(() => formatTranscript(123 as any)).toThrow("Input must be a string");
  });
});
