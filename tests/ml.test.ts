import { describe, it, expect } from "vitest";
import { analyzeUrgencyAndSentiment } from "../src/lib/ml/sentiment-urgency";
import { computeCosineSimilarity, findSimilarIssues } from "../src/lib/ml/similarity";

describe("Edge ML: Sentiment, Urgency & Similarity Engines", () => {
  it("should accurately compute high urgency for distressed consumer messages", () => {
    const distressedMessage =
      "Refrigerator stopped cooling 5 days ago. All groceries are spoiled. Customer care gave no response and technician refused to visit. Unacceptable!!!";

    const analysis = analyzeUrgencyAndSentiment(distressedMessage);

    expect(analysis.urgencyScore).toBeGreaterThanOrEqual(60);
    expect(["frustrated", "furious"]).toContain(analysis.sentiment);
    expect(analysis.riskFactors).toContain("Service Non-Compliance");
  });

  it("should classify calm inquiries with low urgency score", () => {
    const calmMessage =
      "Hello, can you please confirm if the routine courier delivery is scheduled for tomorrow?";

    const analysis = analyzeUrgencyAndSentiment(calmMessage);

    expect(analysis.urgencyScore).toBeLessThan(35);
    expect(analysis.urgencyLevel).toBe("low");
    expect(analysis.sentiment).toBe("calm");
  });

  it("should compute cosine similarity and detect duplicate/related complaints", () => {
    const issueA = "Samsung refrigerator cooling stopped working technician repair";
    const issueB = "Samsung double door fridge not cooling technician visit scheduled";
    const issueC = "Airtel broadband red light optical fiber cut";

    const simAB = computeCosineSimilarity(issueA, issueB);
    const simAC = computeCosineSimilarity(issueA, issueC);

    expect(simAB).toBeGreaterThan(0.4); // Related refrigerator issues
    expect(simAC).toBeLessThan(0.15); // Unrelated telecom issue
  });

  it("should identify similar issues in a dataset", () => {
    const existing = [
      {
        id: "1",
        company: "Samsung",
        title: "Fridge cooling issue",
        description: "Refrigerator technician appointment missed",
      },
      {
        id: "2",
        company: "Airtel",
        title: "Fiber down",
        description: "Red light blinking on router",
      },
    ];

    const matches = findSimilarIssues("Samsung refrigerator not cooling", existing, 0.3);
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe("1");
    expect(matches[0].company).toBe("Samsung");
  });
});
