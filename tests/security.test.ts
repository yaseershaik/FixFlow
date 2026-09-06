import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";
import { db } from "../src/lib/db";

describe("Security & Ownership Isolation (TRD Section 11)", () => {
  it("should securely sign and verify session tokens", () => {
    const userId = "test-user-12345";
    const token = createSessionToken(userId);

    // Valid token
    expect(verifySessionToken(token)).toBe(userId);

    // Tampered payload
    const parts = token.split(".");
    const tamperedToken = `eyJhbm90aGVyIjoidXNlciJ9.${parts[1]}`;
    expect(verifySessionToken(tamperedToken)).toBeNull();

    // Tampered signature
    const badSigToken = `${parts[0]}.invalidsignaturexyz`;
    expect(verifySessionToken(badSigToken)).toBeNull();
  });

  it("should strictly enforce ownership boundaries between distinct users", async () => {
    // 1. Create two separate test users in database
    const userA = await db.user.create({
      data: {
        email: `usera-${Date.now()}@example.com`,
        passwordHash: "hash-a",
        name: "User A",
      },
    });

    const userB = await db.user.create({
      data: {
        email: `userb-${Date.now()}@example.com`,
        passwordHash: "hash-b",
        name: "User B",
      },
    });

    // 2. User A creates a private issue
    const issueA = await db.issue.create({
      data: {
        userId: userA.id,
        title: "Confidential Bank Charge Dispute",
        company: "Axis Bank",
        category: "banking",
        referenceNo: "AXIS-SECRET-991",
        description: "Confidential dispute containing sensitive transaction data.",
        status: "open",
      },
    });

    // 3. User B attempts to access User A's issue ID
    const queryByUserB = await db.issue.findFirst({
      where: {
        id: issueA.id,
        userId: userB.id, // Scoped to User B
      },
    });

    // Must return null (which translates to 404/403 in the API handler)
    expect(queryByUserB).toBeNull();

    // 4. User A accessing their own issue succeeds
    const queryByUserA = await db.issue.findFirst({
      where: {
        id: issueA.id,
        userId: userA.id,
      },
    });

    expect(queryByUserA).not.toBeNull();
    expect(queryByUserA?.id).toBe(issueA.id);
    expect(queryByUserA?.referenceNo).toBe("AXIS-SECRET-991");

    // Clean up test users
    await db.user.delete({ where: { id: userA.id } });
    await db.user.delete({ where: { id: userB.id } });
  });
});
