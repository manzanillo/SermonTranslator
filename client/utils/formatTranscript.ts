export function formatTranscript(text: string): string {
  if (typeof text !== "string") {
    throw new TypeError("Input must be a string");
  }

  return text.trim().replace(/\s+/g, " ");
}
