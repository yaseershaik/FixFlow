import { describe, it, expect } from "vitest";
import { CreateIssueSchema, CreateEventSchema } from "../src/lib/types";

describe("Validation Schemas (TRD Section 6.2)", () => {
  it("should accept valid issue inputs", () => {
    const valid = {
      title: "Refrigerator not cooling",
      company: "Samsung",
      category: "warranty",
      referenceNo: "548921",
      description: "Appliance not cooling properly, technician promised to visit.",
      expectedDate: "2026-09-12",
      status: "waiting",
      nextAction: "Follow up if technician does not visit",
      notes: "Internal notes",
    };

    const res = CreateIssueSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("should reject title shorter than 5 chars or longer than 120 chars", () => {
    const shortTitle = {
      title: "No",
      company: "LG",
      category: "warranty",
      description: "Description is long enough here.",
    };
    expect(CreateIssueSchema.safeParse(shortTitle).success).toBe(false);

    const longTitle = {
      title: "a".repeat(121),
      company: "LG",
      category: "warranty",
      description: "Description is long enough here.",
    };
    expect(CreateIssueSchema.safeParse(longTitle).success).toBe(false);
  });

  it("should reject description shorter than 10 characters", () => {
    const shortDesc = {
      title: "Valid Title",
      company: "Airtel",
      category: "telecom",
      description: "Too short",
    };
    expect(CreateIssueSchema.safeParse(shortDesc).success).toBe(false);
  });

  it("should reject invalid categories", () => {
    const invalidCat = {
      title: "Valid Title",
      company: "Unknown",
      category: "invalid_category",
      description: "Description is long enough here.",
    };
    expect(CreateIssueSchema.safeParse(invalidCat).success).toBe(false);
  });

  it("should validate timeline event creation schema", () => {
    const validEvent = {
      eventType: "call",
      body: "Spoke to customer care representative",
    };
    expect(CreateEventSchema.safeParse(validEvent).success).toBe(true);

    const invalidEvent = {
      eventType: "invalid_type",
      body: "Text",
    };
    expect(CreateEventSchema.safeParse(invalidEvent).success).toBe(false);
  });
});
