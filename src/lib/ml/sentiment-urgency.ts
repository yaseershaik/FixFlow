/**
 * FixFlow Edge ML: Lexical & Feature-Weighted Urgency & Sentiment Scoring Engine
 * Runs on device / Edge with 0ms cloud latency and 0 external API costs.
 */

export interface UrgencyAnalysis {
  urgencyScore: number; // 0 to 100
  urgencyLevel: "low" | "medium" | "high" | "critical";
  sentiment: "calm" | "concerned" | "frustrated" | "furious";
  riskFactors: string[];
}

const CRITICAL_KEYWORDS = new Map<string, number>([
  ["fraud", 28],
  ["cheated", 28],
  ["scam", 25],
  ["police", 30],
  ["legal notice", 35],
  ["lawyer", 28],
  ["consumer court", 35],
  ["cpgrams", 30],
  ["harassment", 25],
  ["medical", 25],
  ["hospital", 25],
  ["emergency", 25],
  ["stranded", 24],
  ["spoiled", 18],
  ["rotten", 18],
  ["unacceptable", 18],
  ["pathetic", 18],
  ["worst", 15],
  ["terrible", 15],
  ["immediately", 15],
  ["urgent", 15],
  ["asap", 14],
  ["no response", 16],
  ["refused", 18],
  ["denied", 16],
  ["not working", 12],
  ["broken", 12],
  ["overdue", 16],
  ["delayed", 10],
  ["weeks", 15],
  ["months", 20],
]);

/**
 * Classifies the urgency and frustration sentiment of any complaint communication.
 */
export function analyzeUrgencyAndSentiment(text: string): UrgencyAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      urgencyScore: 10,
      urgencyLevel: "low",
      sentiment: "calm",
      riskFactors: [],
    };
  }

  const lower = text.toLowerCase();
  let rawScore = 15; // baseline
  const riskFactors: string[] = [];

  // 1. Keyword weights with word boundaries to eliminate false positives
  for (const [kw, weight] of CRITICAL_KEYWORDS.entries()) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(text)) {
      rawScore += weight;
      if (weight >= 20 && !riskFactors.includes("High Escalation Language")) {
        riskFactors.push("High Escalation Language");
      }
      if (["spoiled", "rotten", "medical", "hospital", "stranded"].includes(kw) && !riskFactors.includes("Safety / Perishable Impact")) {
        riskFactors.push("Safety / Perishable Impact");
      }
      if (["no response", "refused", "denied", "overdue"].includes(kw) && !riskFactors.includes("Service Non-Compliance")) {
        riskFactors.push("Service Non-Compliance");
      }
    }
  }

  // 2. Punctuation intensity (e.g. "!!!" or "???")
  const exclamations = (text.match(/!{2,}/g) || []).length;
  if (exclamations > 0) {
    rawScore += Math.min(exclamations * 6, 15);
    if (!riskFactors.includes("High Distress Signals")) {
      riskFactors.push("High Distress Signals");
    }
  }

  // 3. Capitalization rage ratio (e.g. "PLEASE FIX THIS IMMEDIATELY")
  const words = text.split(/\s+/).filter((w) => w.length > 3);
  const uppercaseWords = words.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (words.length > 0 && uppercaseWords.length / words.length > 0.25) {
    rawScore += 15;
    if (!riskFactors.includes("Emphasized Capitalization")) {
      riskFactors.push("Emphasized Capitalization");
    }
  }

  // Cap score between 0 and 100
  const urgencyScore = Math.min(Math.max(Math.round(rawScore), 5), 100);

  // Derive level
  let urgencyLevel: "low" | "medium" | "high" | "critical" = "low";
  if (urgencyScore >= 75) {
    urgencyLevel = "critical";
  } else if (urgencyScore >= 50) {
    urgencyLevel = "high";
  } else if (urgencyScore >= 30) {
    urgencyLevel = "medium";
  }

  // Derive sentiment
  let sentiment: "calm" | "concerned" | "frustrated" | "furious" = "calm";
  if (urgencyScore >= 75) {
    sentiment = "furious";
  } else if (urgencyScore >= 50) {
    sentiment = "frustrated";
  } else if (urgencyScore >= 30) {
    sentiment = "concerned";
  }

  return {
    urgencyScore,
    urgencyLevel,
    sentiment,
    riskFactors,
  };
}
