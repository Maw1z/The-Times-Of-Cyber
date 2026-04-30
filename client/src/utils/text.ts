// Returns a single string excerpt of at least minWords, cutting at a sentence boundary if possible
export function excerptBody(paragraphs = [], minWords = 60, maxWords = 110) {
  const full = paragraphs.join(" ");
  const words = full.split(/\s+/);
  // Pick a random length between minWords and maxWords
  const target =
    minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const slice = words.slice(0, Math.min(target, words.length)).join(" ");
  // Try to end at a sentence boundary
  const sentenceEnd = slice.search(/[.!?][^.!?]*$/);
  return sentenceEnd > 0 ? slice.slice(0, sentenceEnd + 1) : slice + "…";
}
