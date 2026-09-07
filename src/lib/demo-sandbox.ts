import { db } from "@/lib/db";

export const DEMO_EMAIL = "demo@fixflow.app";

/**
 * Resets the demo account to the 5 pristine seed sample complaints.
 * Deletes any user-created temporary complaints, attachments, reminders,
 * and events to prevent using the demo account as a permanent personal tracker.
 */
export async function resetDemoAccount(userId?: string) {
  let targetId = userId;
  if (!targetId) {
    const demoUser = await db.user.findUnique({
      where: { email: DEMO_EMAIL },
      select: { id: true },
    });
    if (!demoUser) return;
    targetId = demoUser.id;
  }

  // 1. Delete all existing child records first (respecting foreign key constraints)
  await db.issueEvent.deleteMany({ where: { userId: targetId } });
  await db.attachment.deleteMany({ where: { userId: targetId } });
  await db.reminder.deleteMany({ where: { userId: targetId } });
  await db.extractionRun.deleteMany({ where: { userId: targetId } });
  await db.issue.deleteMany({ where: { userId: targetId } });

  // Clean up physical disk uploads for demo user (only works in local dev, safely skipped on serverless)
  try {
    const fs = await import("fs");
    const path = await import("path");
    const demoUploadsDir = path.join(process.cwd(), "uploads", targetId);
    if (fs.existsSync(demoUploadsDir)) {
      fs.rmSync(demoUploadsDir, { recursive: true, force: true });
    }
  } catch {
    // Silently skip — filesystem cleanup is optional on serverless platforms (Vercel)
  }

  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // 2. Re-create the 5 canonical demo complaints
  // Issue 1: Samsung Fridge (Overdue)
  const issue1 = await db.issue.create({
    data: {
      userId: targetId,
      title: "Samsung: Double Door Refrigerator not cooling (#SR-948201)",
      company: "Samsung Care",
      category: "warranty",
      referenceNo: "SR-948201",
      description:
        "Refrigerator temperature rising above 18°C. Food spoiling. Customer care booked technician visit promised for 2 days ago, but no technician showed up and no call was received.",
      status: "action_needed",
      expectedDate: daysAgo(2),
      nextAction: "Escalate to Samsung nodal officer / service manager for immediate technician re-assignment.",
      notes: "Invoice copy uploaded. Serial number: RF28R7351SR. Customer care phone: 1800-40-7267864.",
      createdAt: daysAgo(5),
    },
  });

  await db.issueEvent.createMany({
    data: [
      {
        issueId: issue1.id,
        userId: targetId,
        eventType: "created",
        body: "Ticket lodged on Samsung Care portal. Service Request SR-948201 generated.",
        eventAt: daysAgo(5),
      },
      {
        issueId: issue1.id,
        userId: targetId,
        eventType: "call",
        body: "Called support. Agent Ravi confirmed technician will visit by 2 days ago.",
        eventAt: daysAgo(3),
      },
      {
        issueId: issue1.id,
        userId: targetId,
        eventType: "escalation",
        body: "Technician did not arrive on promised date. Status marked as Action Needed.",
        eventAt: daysAgo(1),
      },
    ],
  });

  // Issue 2: Airtel Broadband (Due Soon)
  const issue2 = await db.issue.create({
    data: {
      userId: targetId,
      title: "Airtel Xstream: Fiber broadband red LOS light outage (#TT-88310)",
      company: "Airtel",
      category: "telecom",
      referenceNo: "TT-88310",
      description:
        "Complete fiber internet loss since yesterday morning. Router LOS indicator blinking red. Work-from-home impacted.",
      status: "waiting",
      expectedDate: daysFromNow(1),
      nextAction: "Verify fiber connectivity after field engineer splicing visit tomorrow at 11:00 AM.",
      notes: "Account DSL ID: 011-4928172. Engineer contact: 9871234567.",
      createdAt: daysAgo(1),
    },
  });

  await db.issueEvent.createMany({
    data: [
      {
        issueId: issue2.id,
        userId: targetId,
        eventType: "created",
        body: "Automated network check failed. Complaint registered on Airtel Thanks app.",
        eventAt: daysAgo(1),
      },
      {
        issueId: issue2.id,
        userId: targetId,
        eventType: "promise_updated",
        body: "SMS received: Field engineer assigned. Estimated resolution tomorrow before 2 PM.",
        eventAt: daysAgo(0),
      },
    ],
  });

  // Issue 3: Flipkart Refund
  const issue3 = await db.issue.create({
    data: {
      userId: targetId,
      title: "Flipkart: Cancelled air fryer refund not received in bank (#OD409218201)",
      company: "Flipkart",
      category: "refund",
      referenceNo: "OD409218201",
      description:
        "Order was cancelled prior to dispatch. Flipkart status says 'Refund Processed' with RRN 42918402, but HDFC bank statement shows no credit after 7 business days.",
      status: "action_needed",
      expectedDate: daysAgo(1),
      nextAction: "Submit bank statement showing uncredited transaction to grievance-officer@flipkart.com.",
      notes: "Amount: INR 4,899. Payment method: HDFC Millennia Credit Card.",
      createdAt: daysAgo(8),
    },
  });

  await db.issueEvent.createMany({
    data: [
      {
        issueId: issue3.id,
        userId: targetId,
        eventType: "created",
        body: "Order cancelled, awaiting refund credit.",
        eventAt: daysAgo(8),
      },
      {
        issueId: issue3.id,
        userId: targetId,
        eventType: "email",
        body: "Support sent RRN number. Stated it takes 3-5 days to reflect.",
        eventAt: daysAgo(4),
      },
    ],
  });

  // Issue 4: Blue Dart Courier (Open)
  const issue4 = await db.issue.create({
    data: {
      userId: targetId,
      title: "Blue Dart: Courier package stuck at hub for 4 days (#AWB-672910)",
      company: "Blue Dart",
      category: "delivery",
      referenceNo: "AWB-672910",
      description:
        "Package arrived at Regional Sorting Facility on Monday and has not moved. Tracking states 'Consignment In Transit'.",
      status: "open",
      expectedDate: daysFromNow(3),
      nextAction: "Call Blue Dart hub manager if tracking does not update by evening.",
      notes: "Destination pincode: 110001.",
      createdAt: daysAgo(2),
    },
  });

  await db.issueEvent.create({
    data: {
      issueId: issue4.id,
      userId: targetId,
      eventType: "created",
      body: "Tracking monitored. Delivery window extended by carrier.",
      eventAt: daysAgo(2),
    },
  });

  // Issue 5: Swiggy (Resolved)
  const issue5 = await db.issue.create({
    data: {
      userId: targetId,
      title: "Swiggy: Missing item from dinner order refunded (#SWIG-92817)",
      company: "Swiggy",
      category: "refund",
      referenceNo: "SWIG-92817",
      description:
        "Gourmet Burger order delivered missing 2 milkshakes. Raised instant query on Swiggy help bot.",
      status: "resolved",
      expectedDate: daysAgo(6),
      nextAction: "None. Resolved and credited to Swiggy Money wallet.",
      notes: "Refund amount: INR 340 credited immediately.",
      createdAt: daysAgo(7),
    },
  });

  await db.issueEvent.createMany({
    data: [
      {
        issueId: issue5.id,
        userId: targetId,
        eventType: "created",
        body: "Ticket raised via app chat.",
        eventAt: daysAgo(7),
      },
      {
        issueId: issue5.id,
        userId: targetId,
        eventType: "status_change",
        body: "Swiggy issued full refund of INR 340 to wallet. Issue resolved.",
        eventAt: daysAgo(6),
      },
    ],
  });
}
