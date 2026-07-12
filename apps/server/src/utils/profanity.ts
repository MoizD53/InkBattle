// ─── Profanity Filter ─────────────────────────────────────────

const PROFANITY_LIST: string[] = [
  'ass', 'asshole', 'bastard', 'bitch', 'bollocks', 'bullshit',
  'cock', 'crap', 'cunt', 'damn', 'dick', 'douche',
  'fag', 'fuck', 'goddamn', 'hell', 'jerk', 'motherfucker',
  'nigger', 'piss', 'prick', 'pussy', 'shit', 'slut',
  'twat', 'whore', 'wanker',
];

// Build a Set for O(1) lookups
const profanitySet = new Set(PROFANITY_LIST);

/**
 * Check if text contains profanity.
 * Splits the input into words and checks each against the list.
 */
export function containsProfanity(text: string): boolean {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  return words.some((word) => profanitySet.has(word));
}

/**
 * Replace profane words with asterisks.
 */
export function filterProfanity(text: string): string {
  const regex = new RegExp(`\\b(${PROFANITY_LIST.join('|')})\\b`, 'gi');
  return text.replace(regex, (match) => '*'.repeat(match.length));
}
