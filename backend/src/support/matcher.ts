import { FAQ, type FaqEntry } from './faq';

export interface SupportReply {
  matched: boolean;
  answer: string;
  link?: { label: string; to: string };
  // Questions the user can touch to continue
  suggestions: string[];
}

export const MESSAGE_MAX_LENGTH = 300;
const MIN_SCORE = 1;
const MAX_SUGGESTIONS = 3;
const FALLBACK_IDS = ['deck-create', 'combo-create', 'sell', 'buy'];

/** Lowercase, no accents, no punctuation, divided into words, simplyfied plurals */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(stem);
}

function stem(word: string): string {
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

/** True if `phrase` appears in `tokens` as a contiguous sequence of words */
function containsPhrase(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0 || phrase.length > tokens.length) return false;
  for (let i = 0; i <= tokens.length - phrase.length; i++) {
    if (phrase.every((word, j) => tokens[i + j] === word)) return true;
  }
  return false;
}

/** A word weighs 1; every word in more than a sentence adds 1.5, since it is more specific */
export function keywordWeight(wordCount: number): number {
  return 1 + (wordCount - 1) * 1.5;
}

export function scoreEntry(tokens: string[], entry: FaqEntry): number {
  let score = 0;
  for (const keyword of entry.keywords) {
    const phrase = tokenize(keyword);
    if (containsPhrase(tokens, phrase)) score += keywordWeight(phrase.length);
  }
  return score;
}

function byId(id: string, faq: FaqEntry[]): FaqEntry | undefined {
  return faq.find((entry) => entry.id === id);
}

export function answerQuestion(message: string, faq: FaqEntry[] = FAQ): SupportReply {
  const tokens = tokenize(message);

  const ranked = faq
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry) }))
    .filter((item) => item.score > 0)
    // sort is stable: if the score is tied, it keeps the order of the FAQ file
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best || best.score < MIN_SCORE) {
    return {
      matched: false,
      answer:
        "I couldn't find an answer to that. Try rephrasing with a few keywords, or pick one of these topics.",
      suggestions: FALLBACK_IDS.map((id) => byId(id, faq)?.question).filter(
        (q): q is string => q !== undefined,
      ),
    };
  }

  return {
    matched: true,
    answer: best.entry.answer,
    link: best.entry.link,
    suggestions: ranked.slice(1, 1 + MAX_SUGGESTIONS).map((item) => item.entry.question),
  };
}