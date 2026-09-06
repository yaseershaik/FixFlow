import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { checkRateLimit } from "../src/lib/rate-limit";

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

  it("should encode and verify full user session data in-memory without database lookups", async () => {
    const { verifySessionTokenPayload } = await import("../src/lib/auth");
    const user = { id: "user-abc-123", email: "consumer@example.com", name: "Ananya Sharma" };
    const fastToken = createSessionToken(user);

    const payload = verifySessionTokenPayload(fastToken);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(user.id);
    expect(payload?.email).toBe(user.email);
    expect(payload?.name).toBe(user.name);
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

  it("should enforce sliding window rate limits", () => {
    const testKey = `test-ip-${Date.now()}`;

    // First 3 requests under limit 3 should succeed
    expect(checkRateLimit(testKey, 3, 1000).success).toBe(true);
    expect(checkRateLimit(testKey, 3, 1000).success).toBe(true);
    expect(checkRateLimit(testKey, 3, 1000).success).toBe(true);

    // 4th request must be rate limited
    const overLimit = checkRateLimit(testKey, 3, 1000);
    expect(overLimit.success).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it("should securely hash passwords with scrypt and verify correctly", async () => {
    const { hashPassword, verifyPassword } = await import("../src/lib/auth");
    const plaintext = "SuperSecretPassword123!";
    const hash = hashPassword(plaintext);

    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash.split(":").length).toBe(3);

    // Correct password verifies successfully
    const result1 = verifyPassword(plaintext, hash);
    expect(result1.valid).toBe(true);
    expect(result1.needsRehash).toBe(false);

    // Incorrect password fails
    const result2 = verifyPassword("WrongPassword123!", hash);
    expect(result2.valid).toBe(false);

    // Two identical passwords produce different salts and hashes
    const hash2 = hashPassword(plaintext);
    expect(hash).not.toBe(hash2);
  });

  it("should verify legacy HMAC hashes and signal rehash needed", async () => {
    const { verifyPassword } = await import("../src/lib/auth");
    const crypto = await import("crypto");
    const password = "demo123Password";
    const secret = process.env.SESSION_SECRET || "fixflow-secret-salt-default-key-2026";
    const legacyHash = crypto
      .createHmac("sha256", secret)
      .update(password)
      .digest("hex");

    const check = verifyPassword(password, legacyHash);
    expect(check.valid).toBe(true);
    expect(check.needsRehash).toBe(true);

    const wrongCheck = verifyPassword("incorrectPassword", legacyHash);
    expect(wrongCheck.valid).toBe(false);
  });

  it("should handle password reset tokens with expiration correctly", async () => {
    const testEmail = `reset-test-${Date.now()}@example.com`;
    const resetCode = "849201";
    const futureExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await db.user.create({
      data: {
        email: testEmail,
        passwordHash: "scrypt:placeholder:hash",
        name: "Reset Tester",
        resetToken: resetCode,
        resetTokenExpiry: futureExpiry,
      },
    });

    // Valid unexpired code
    const validUser = await db.user.findFirst({
      where: {
        email: testEmail,
        resetToken: resetCode,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    expect(validUser).not.toBeNull();
    expect(validUser?.id).toBe(user.id);

    // Expired code should not match
    const pastExpiry = new Date(Date.now() - 1000);
    await db.user.update({
      where: { id: user.id },
      data: { resetTokenExpiry: pastExpiry },
    });

    const expiredUser = await db.user.findFirst({
      where: {
        email: testEmail,
        resetToken: resetCode,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    expect(expiredUser).toBeNull();

    // Clean up
    await db.user.delete({ where: { id: user.id } });
  });

  it("should reject disposable, temporary, burner, and fake email addresses", async () => {
    const { validateRealEmail } = await import("../src/lib/email-validator");

    // Known burner/disposable domains
    const burnerEmails = [
      "user@tempmail.com",
      "test@temp-mail.org",
      "hacker@guerrillamail.com",
      "spammer@mailinator.com",
      "throwaway@10minutemail.com",
      "anon@yopmail.com",
      "trash@sharklasers.com",
      "temp@burnermail.io",
      "fake@getnada.com",
      "burner@fakeinbox.com",
      "junk@mohmal.com",
      "throw@dispostable.com",
      // Subdomains of disposable providers
      "victim@custom.mailinator.com",
      "alert@inbox.guerrillamail.com",
      // Pattern matches for disposable services
      "auto@temp-mailbox-generator.org",
      "trash@throwaway-service.net",
      "user@burner-box.io",
      // Dummy / test domains
      "test@fake.com",
      "developer@dummy.com",
      "nobody@nowhere.com",
      "user@test.com",
      // Malformed / invalid emails
      "invalid-email",
      "@nodomain.com",
      "user@",
      "user@domain",
      "user@domain..com",
    ];

    for (const email of burnerEmails) {
      const result = validateRealEmail(email);
      expect(result.isValid, `Expected ${email} to be rejected`).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it("should permit legitimate consumer, corporate, and demo email addresses", async () => {
    const { validateRealEmail } = await import("../src/lib/email-validator");

    const legitimateEmails = [
      "consumer@gmail.com",
      "citizen@yahoo.co.in",
      "support@outlook.com",
      "dev@proton.me",
      "worker@icloud.com",
      "officer@tcs.com",
      "grievance@tatacliq.com",
      "complaints@gov.in",
      "user.name+tag@company.co.uk",
      "demo@fixflow.app", // FixFlow demo account must be allowed
    ];

    for (const email of legitimateEmails) {
      const result = validateRealEmail(email);
      expect(result.isValid, `Expected ${email} to be accepted`).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });
});

