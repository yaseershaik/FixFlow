import crypto from "crypto";
import { ExtractionResult, IssueCategory, IssueStatus } from "./types";

export function hashInput(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

const KNOWN_COMPANIES = [
  "Amazon",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Airtel",
  "Jio",
  "Vodafone",
  "Vi",
  "Samsung",
  "Apple",
  "LG",
  "Whirlpool",
  "Sony",
  "Dell",
  "HP",
  "Lenovo",
  "Uber",
  "Ola",
  "Blinkit",
  "Zepto",
  "Dunzo",
  "HDFC Bank",
  "SBI",
  "ICICI Bank",
  "Axis Bank",
  "Kotak",
  "BSES",
  "Tata Power",
  "Blue Dart",
  "Delhivery",
  "DTDC",
  "India Post",
];

export async function extractIssueFromText(text: string): Promise<ExtractionResult> {
  const trimmed = text.trim();

  // If Gemini API key is configured, try calling Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiResult = await extractWithGemini(trimmed, process.env.GEMINI_API_KEY);
      if (geminiResult) return geminiResult;
    } catch (err) {
      console.warn("Gemini extraction failed, falling back to heuristic extractor:", err);
    }
  }

  // If OpenAI API key is configured, try calling OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResult = await extractWithOpenAI(trimmed, process.env.OPENAI_API_KEY);
      if (openaiResult) return openaiResult;
    } catch (err) {
      console.warn("OpenAI extraction failed, falling back to heuristic extractor:", err);
    }
  }

  // Intelligent local heuristic extraction engine (zero dependency, deterministic & compliant with guardrails)
  return extractHeuristic(trimmed);
}

function extractHeuristic(text: string): ExtractionResult {
  const missing: string[] = [];
  const confidence = {
    title: 0.5,
    company: 0,
    reference_number: 0,
    promised_action: 0,
    promised_date: 0,
  };

  // 1. Reference / Docket / Ticket number extraction
  // Guardrail: Never invent a reference number. Look for explicit pattern matches.
  let referenceNo: string | null = null;
  const refPatterns = [
    /#\s*([a-z0-9\-_]{4,25})/i,
    /(?:service\s*request|ticket|docket|ref(?:erence)?|complaint|sr|order|tracking(?:\s*number)?|awb|consignment|work\s*order|case)\s*(?:no|id|num|number)?\s*[:#-]?\s*([a-z0-9\-_]*\d+[a-z0-9\-_]*)/i,
    /\b(\d{6,14})\b/,
  ];

  for (const pat of refPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      referenceNo = match[1].trim();
      confidence.reference_number = 0.9;
      break;
    }
  }

  if (!referenceNo) {
    missing.push("reference_number");
  }

  // 2. Company / Provider extraction
  // Guardrail: Never infer a company name when not supported by input.
  let company: string | null = null;
  for (const c of KNOWN_COMPANIES) {
    const regex = new RegExp(`\\b${c}\\b`, "i");
    if (regex.test(text)) {
      company = c;
      confidence.company = 0.95;
      break;
    }
  }

  if (!company) {
    // Check for company/brand indicator like "@company.com" or "team <Brand>"
    const teamMatch = text.match(/(?:team|from|support at|care at)\s+([A-Z][a-zA-Z0-9&]+)/i);
    if (teamMatch && teamMatch[1]) {
      company = teamMatch[1];
      confidence.company = 0.7;
    }
  }

  if (!company) {
    missing.push("company");
  }

  // 3. Category classification
  const lower = text.toLowerCase();
  let category: IssueCategory = "other";

  const isBankEntity =
    company && ["HDFC Bank", "SBI", "ICICI Bank", "Axis Bank", "Kotak"].includes(company);

  if (isBankEntity || /\b(sbi|hdfc|icici|axis)\b/i.test(text)) {
    category = "banking";
  } else if (
    /\b(refund|money back|cancellation fee|debited|charged me)\b/i.test(text)
  ) {
    category = "refund";
  } else if (
    (company && ["Blue Dart", "Delhivery", "DTDC", "India Post"].includes(company)) ||
    /\b(delivery|courier|consignment|shipment|dispatch|awb)\b/i.test(text)
  ) {
    category = "delivery";
  } else if (
    /\b(refrigerator|fridge|technician|repair|cooling|warranty|washing machine|appliance|monitor|display|cracked|defective)\b/i.test(
      text
    ) ||
    /\b(tv|ac)\b/i.test(text)
  ) {
    category = "warranty";
  } else if (
    /\b(banking|atm|emi|loan|debit card|credit card|cheque)\b/i.test(text)
  ) {
    category = "banking";
  } else if (
    /\b(broadband|wifi|network|sim|telecom|fiber|recharge)\b/i.test(text) ||
    (company && ["Airtel", "Jio", "Vodafone", "Vi"].includes(company))
  ) {
    category = "telecom";
  } else if (/\b(college|university|exam|course|degree|mark sheet)\b/i.test(text)) {
    category = "education";
  } else if (
    /\b(cpgrams|municipal|police|authority|portal|power|electricity|voltage|water supply|pipeline)\b/i.test(
      text
    ) ||
    (company && ["Tata Power", "BSES"].includes(company))
  ) {
    category = "government";
  }

  // 4. Promised action & date extraction
  let promisedAction: string | null = null;
  let promisedDate: string | null = null;

  // Check for common promised actions
  if (/technician\s+(?:will\s+)?visit|visit\s+by\s+technician/i.test(text)) {
    promisedAction = "Technician visit";
    confidence.promised_action = 0.85;
  } else if (/call\s*back|will\s+call/i.test(text)) {
    promisedAction = "Customer support call back";
    confidence.promised_action = 0.8;
  } else if (/refund\s+(?:will\s+be\s+processed|in\s+\d+|within)/i.test(text)) {
    promisedAction = "Refund processing";
    confidence.promised_action = 0.85;
  } else if (/deliver(?:y)?\s+(?:by|on|expected)/i.test(text)) {
    promisedAction = "Package delivery";
    confidence.promised_action = 0.8;
  } else if (/resol(?:ution|ve)\s+(?:by|within)/i.test(text)) {
    promisedAction = "Resolution";
    confidence.promised_action = 0.75;
  }

  if (!promisedAction) {
    missing.push("promised_action");
  }

  // Date extraction: check for specific dates like "12 Sept", "Sept 12", "tomorrow", "Tuesday"
  const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
  const datePatterns = [
    new RegExp(`\\b(\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${MONTHS})(?:\\s+\\d{4})?)\\b`, "i"),
    new RegExp(`\\b((?:${MONTHS})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s+\\d{4})?)\\b`, "i"),
    /\b(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/,
    /\b(tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i,
  ];

  for (const pat of datePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const rawDate = match[1].trim();
      const normalized = normalizeDateString(rawDate);
      promisedDate = normalized;
      confidence.promised_date = 0.85;
      break;
    }
  }

  if (!promisedDate) {
    missing.push("promised_date");
  }

  // 5. Issue summary & title
  // Extract key sentences describing the problem
  const sentences = text
    .split(/[.?!;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  let issueSummary = sentences[0] || text.slice(0, 150);
  for (const s of sentences) {
    if (
      /(?:not|issue|problem|broken|delayed|wrong|error|failed|damaged|cooling|missing|defective)/i.test(
        s
      )
    ) {
      issueSummary = s;
      break;
    }
  }

  let title = issueSummary;
  if (company && referenceNo) {
    title = `${company}: ${issueSummary.slice(0, 60)} (#${referenceNo})`;
  } else if (company) {
    title = `${company}: ${issueSummary.slice(0, 70)}`;
  } else if (referenceNo) {
    title = `${issueSummary.slice(0, 60)} (#${referenceNo})`;
  }

  if (title.length < 5) {
    title = "Service complaint regarding " + category;
  }
  if (title.length > 120) {
    title = title.slice(0, 117) + "...";
  }

  // 6. Status and Next Action
  let status: IssueStatus = "waiting";
  let nextAction: string | null = null;

  if (
    lower.includes("provide") ||
    lower.includes("submit") ||
    lower.includes("send photo") ||
    lower.includes("action required")
  ) {
    status = "action_needed";
    nextAction = "Submit requested details/documents";
  } else if (promisedAction) {
    status = "waiting";
    nextAction = `Follow up if ${promisedAction.toLowerCase()} does not occur${promisedDate ? " by " + promisedDate : ""}`;
  } else {
    status = "open";
    nextAction = "Follow up with customer support";
  }

  return {
    title,
    company,
    category,
    reference_number: referenceNo,
    issue_summary: issueSummary,
    promised_action: promisedAction,
    promised_date: promisedDate,
    status,
    next_action: nextAction,
    confidence_by_field: confidence,
    missing_fields: missing,
  };
}

function normalizeDateString(dateStr: string): string {
  try {
    const lower = dateStr.toLowerCase().trim();
    const now = new Date();

    if (lower === "tomorrow") {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let i = 0; i < weekdays.length; i++) {
      if (lower.includes(weekdays[i])) {
        const currentDay = now.getDay();
        let targetDay = i;
        let diff = targetDay - currentDay;
        if (diff <= 0) diff += 7;
        const d = new Date(now);
        d.setDate(d.getDate() + diff);
        return d.toISOString().split("T")[0];
      }
    }

    // Try parsing standard formats like "12 Sept" or "Sept 12"
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      // If year is past or missing, adjust to current or next year
      if (parsed.getFullYear() < 2000) {
        parsed.setFullYear(now.getFullYear());
      }
      return parsed.toISOString().split("T")[0];
    }
  } catch {
    // fallback
  }
  return dateStr;
}

async function extractWithGemini(text: string, apiKey: string): Promise<ExtractionResult | null> {
  const prompt = `You are the extraction engine for FixFlow, a service-issue follow-up tracker.
Convert this real-world messy communication into structured fields according to strict guardrails:
- Never invent a reference number. Only extract if explicitly present in text.
- Never guess or infer a company name if not explicitly mentioned. Return null if unknown.
- Set category to one of: 'delivery', 'telecom', 'warranty', 'refund', 'banking', 'education', 'government', 'other'.
- Set status to one of: 'open', 'waiting', 'action_needed', 'resolved', 'closed'.
- Return ONLY valid JSON matching this schema:
{
  "title": string,
  "company": string | null,
  "category": string,
  "reference_number": string | null,
  "issue_summary": string,
  "promised_action": string | null,
  "promised_date": string | null (ISO YYYY-MM-DD if determinable),
  "status": string,
  "next_action": string | null,
  "confidence_by_field": {
    "title": number (0-1),
    "company": number (0-1),
    "reference_number": number (0-1),
    "promised_action": number (0-1),
    "promised_date": number (0-1)
  },
  "missing_fields": string[]
}

User communication:
"""${text}"""`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJson) return null;
  return JSON.parse(rawJson);
}

async function extractWithOpenAI(text: string, apiKey: string): Promise<ExtractionResult | null> {
  const prompt = `Extract service issue details from this text into JSON:
- Never invent a reference number.
- Never guess company name.
- Schema: title, company, category, reference_number, issue_summary, promised_action, promised_date, status, next_action, confidence_by_field, missing_fields.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  return JSON.parse(content);
}
