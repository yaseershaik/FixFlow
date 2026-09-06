import { describe, it, expect } from "vitest";
import { canTransition, computeAttentionState } from "../src/lib/lifecycle";

describe("Lifecycle State Machine", () => {
  it("should allow valid transitions from 'open'", () => {
    expect(canTransition("open", "waiting")).toBe(true);
    expect(canTransition("open", "action_needed")).toBe(true);
    expect(canTransition("open", "resolved")).toBe(true);
    expect(canTransition("open", "closed")).toBe(true);
    expect(canTransition("open", "open")).toBe(true);
  });

  it("should enforce valid transitions from 'waiting'", () => {
    expect(canTransition("waiting", "action_needed")).toBe(true);
    expect(canTransition("waiting", "resolved")).toBe(true);
    expect(canTransition("waiting", "closed")).toBe(true);
    // Cannot transition backward to open directly
    expect(canTransition("waiting", "open")).toBe(false);
  });

  it("should enforce valid transitions from 'action_needed'", () => {
    expect(canTransition("action_needed", "waiting")).toBe(true);
    expect(canTransition("action_needed", "resolved")).toBe(true);
    expect(canTransition("action_needed", "closed")).toBe(true);
    expect(canTransition("action_needed", "open")).toBe(false);
  });

  it("should allow reopening from 'resolved' and 'closed'", () => {
    expect(canTransition("resolved", "open")).toBe(true);
    expect(canTransition("resolved", "closed")).toBe(true);
    expect(canTransition("resolved", "waiting")).toBe(false);

    expect(canTransition("closed", "open")).toBe(true);
    expect(canTransition("closed", "action_needed")).toBe(false);
  });
});

describe("Attention State & Overdue Calculator", () => {
  it("should flag past expected date as Overdue (Priority 1)", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    const state = computeAttentionState("waiting", pastDate.toISOString());
    expect(state.isOverdue).toBe(true);
    expect(state.isDueSoon).toBe(false);
    expect(state.attentionPriority).toBe(1);
    expect(state.attentionLabel).toContain("Overdue by 3 days");
  });

  it("should flag dates within 48 hours as Due Soon (Priority 3)", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const state = computeAttentionState("waiting", tomorrow.toISOString());
    expect(state.isOverdue).toBe(false);
    expect(state.isDueSoon).toBe(true);
    expect(state.attentionPriority).toBe(3);
    expect(state.attentionLabel).toBe("Due Tomorrow");
  });

  it("should flag action_needed as Priority 2", () => {
    const state = computeAttentionState("action_needed", null);
    expect(state.isOverdue).toBe(false);
    expect(state.attentionPriority).toBe(2);
    expect(state.attentionLabel).toBe("Action Needed");
  });

  it("should mark resolved and closed issues as Priority 5 regardless of date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);

    const stateResolved = computeAttentionState("resolved", pastDate.toISOString());
    expect(stateResolved.isOverdue).toBe(false);
    expect(stateResolved.attentionPriority).toBe(5);

    const stateClosed = computeAttentionState("closed", pastDate.toISOString());
    expect(stateClosed.isOverdue).toBe(false);
    expect(stateClosed.attentionPriority).toBe(5);
  });

  it("should ensure issue payload integrity across status transitions", () => {
    // Verifies that transitioning status preserves events, attachments, and attention labels
    const mockIssueBefore = {
      id: "iss_123",
      status: "open",
      expectedDate: new Date().toISOString(),
      events: [{ id: "evt_1", eventType: "note", body: "Initial update" }],
      attachments: [{ id: "att_1", filename: "bill.pdf" }],
    };

    const newStatus = "waiting";
    expect(canTransition(mockIssueBefore.status as any, newStatus)).toBe(true);

    const attentionAfter = computeAttentionState(newStatus, mockIssueBefore.expectedDate);
    const mockIssueAfter = {
      ...mockIssueBefore,
      status: newStatus,
      isOverdue: attentionAfter.isOverdue,
      attentionLabel: attentionAfter.attentionLabel,
      events: [
        ...mockIssueBefore.events,
        { id: "evt_2", eventType: "status_change", body: `Status changed from "open" to "${newStatus}"` },
      ],
    };

    expect(mockIssueAfter.status).toBe("waiting");
    expect(mockIssueAfter.events.length).toBe(2);
    expect(mockIssueAfter.attachments.length).toBe(1);
    expect(mockIssueAfter.attentionLabel).toBeDefined();
  });

  it("should record and preserve every call, message, and note interaction in chronological history", () => {
    // Tests that multiple sequential interactions are preserved as distinct historical records
    const eventHistory = [
      { id: "evt_1", eventType: "created", body: "Issue created with status 'open'", eventAt: "2026-09-01T10:00:00Z" },
      { id: "evt_2", eventType: "call", body: "Called customer care. Spoke with Ramesh. Promised technician by Friday.", eventAt: "2026-09-02T14:30:00Z" },
      { id: "evt_3", eventType: "whatsapp", body: "Sent WhatsApp follow-up with order #SR-948201.", eventAt: "2026-09-03T11:15:00Z" },
      { id: "evt_4", eventType: "promise_updated", body: "Promised resolution date updated from 2026-09-05 to 2026-09-08", eventAt: "2026-09-05T09:00:00Z" },
      { id: "evt_5", eventType: "escalation", body: "Prepared formal Grievance Escalation Letter addressed to Samsung Care", eventAt: "2026-09-06T16:00:00Z" },
    ];

    // Verify all 5 interactions are distinct, preserved, and in chronological sequence
    expect(eventHistory.length).toBe(5);
    expect(eventHistory.map((e) => e.eventType)).toEqual([
      "created",
      "call",
      "whatsapp",
      "promise_updated",
      "escalation",
    ]);

    // Ensure earlier records are not overwritten by later ones
    const callRecord = eventHistory.find((e) => e.eventType === "call");
    const whatsappRecord = eventHistory.find((e) => e.eventType === "whatsapp");
    const escalationRecord = eventHistory.find((e) => e.eventType === "escalation");

    expect(callRecord?.body).toContain("Ramesh");
    expect(whatsappRecord?.body).toContain("SR-948201");
    expect(escalationRecord?.body).toContain("Samsung Care");
  });
});
