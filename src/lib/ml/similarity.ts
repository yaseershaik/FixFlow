/**
 * FixFlow Edge ML: TF-IDF & Cosine Similarity Duplicate / Related Issue Detector
 * Runs entirely in-process with 0 external vector databases or paid embeddings.
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
  "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his",
  "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
  "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
  "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
  "over", "own", "same", "she", "should", "so", "some", "such", "than", "that",
  "the", "their", "theirs", "them", "themselves", "then", "there", "these",
  "they", "this", "those", "through", "to", "too", "under", "until", "up",
  "very", "was", "we", "were", "what", "when", "where", "which", "while",
  "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function getTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

/**
 * Computes the Cosine Similarity between two text passages (0 to 1).
 */
export function computeCosineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const tfA = getTermFrequency(tokensA);
  const tfB = getTermFrequency(tokensB);

  let dotProduct = 0;
  for (const [term, countA] of tfA.entries()) {
    const countB = tfB.get(term) || 0;
    dotProduct += countA * countB;
  }

  let normA = 0;
  for (const count of tfA.values()) {
    normA += count * count;
  }

  let normB = 0;
  for (const count of tfB.values()) {
    normB += count * count;
  }

  if (normA === 0 || normB === 0) return 0;

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.min(Math.max(Number(similarity.toFixed(3)), 0), 1);
}

export interface RelatedMatch {
  id: string;
  title: string;
  company: string;
  similarity: number;
}

/**
 * Finds existing issues that share high semantic similarity with a new or target issue.
 */
export function findSimilarIssues(
  targetText: string,
  existingIssues: Array<{ id: string; title: string; company: string; description: string }>,
  threshold = 0.35
): RelatedMatch[] {
  const matches: RelatedMatch[] = [];

  for (const issue of existingIssues) {
    const candidateText = `${issue.company} ${issue.title} ${issue.description}`;
    const score = computeCosineSimilarity(targetText, candidateText);

    if (score >= threshold) {
      matches.push({
        id: issue.id,
        title: issue.title,
        company: issue.company,
        similarity: score,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}
