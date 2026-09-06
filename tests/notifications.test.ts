import { describe, it, expect } from "vitest";
import {
  generateWhatsAppFollowupUrl,
  generateMailtoEscalationUrl,
} from "../src/lib/notifications";

describe("Notification & Real Communication Engine", () => {
  it("should correctly format WhatsApp follow-up link with phone number and case details", () => {
    const url = generateWhatsAppFollowupUrl({
      company: "Samsung",
      phone: "9876543210",
      referenceNo: "SR-548921",
      title: "Refrigerator not cooling",
      expectedDate: "2026-09-08",
      daysRemaining: -2,
    });

    expect(url).toContain("https://wa.me/919876543210?text=");
    expect(url).toContain("Samsung");
    expect(url).toContain("SR-548921");
    expect(url).toContain("OVERDUE");
  });

  it("should generate WhatsApp link even if no phone number is provided", () => {
    const url = generateWhatsAppFollowupUrl({
      company: "Flipkart",
      referenceNo: "OD40918230",
      title: "Delayed return refund",
    });

    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
    expect(url).toContain("Flipkart");
    expect(url).toContain("OD40918230");
  });

  it("should format mailto escalation link with subject and pre-filled body", () => {
    const mailto = generateMailtoEscalationUrl({
      company: "Airtel",
      email: "grievance@airtel.com",
      referenceNo: "TT-948210",
      subject: "[URGENT ESCALATION] Unresolved Complaint #TT-948210 - Airtel",
      body: "Dear Grievance Redressal Team,\n\nPlease resolve the broadband outage.",
    });

    expect(mailto.startsWith("mailto:grievance@airtel.com?subject=")).toBe(true);
    expect(mailto).toContain("URGENT%20ESCALATION");
    expect(mailto).toContain("broadband%20outage");
  });
});
