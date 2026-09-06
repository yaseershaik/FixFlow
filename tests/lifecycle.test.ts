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
});
