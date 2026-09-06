import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();
const SECRET = process.env.SESSION_SECRET || "fixflow-secret-salt-default-key-2026";

function hashPassword(password) {
  return crypto.createHmac("sha256", SECRET).update(password).digest("hex");
}

async function main() {
  console.log("Seeding FixFlow database with realistic sample issues...");

  // 1. Create Demo User
  const demoEmail = "demo@fixflow.app";
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Alex Demo",
      passwordHash: hashPassword("demo123"),
    },
  });

  console.log(`Demo user created: ${user.email} (ID: ${user.id})`);

  // Clear existing issues for demo user to have clean seed state
  await prisma.issue.deleteMany({ where: { userId: user.id } });

  const now = new Date();

  // Helper date offset
  const daysAgo = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  const daysFromNow = (days) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Issue 1: Overdue Warranty Repair (Appliance) - Priority 1 (Overdue)
  const issue1 = await prisma.issue.create({
    data: {
      userId: user.id,
      title: "Samsung: Double Door Refrigerator not cooling (#SR-948201)",
      company: "Samsung Care",
      category: "warranty",
      referenceNo: "SR-948201",
      description:
        "Refrigerator temperature rising above 18°C. Food spoiling. Customer care booked technician visit promised for 2 days ago, but no technician showed up and no call was received.",
      status: "action_needed",
      expectedDate: daysAgo(2), // Overdue by 2 days!
      nextAction: "Escalate to Samsung nodal officer / service manager for immediate technician re-assignment.",
      notes: "Invoice copy uploaded. Serial number: RF28R7351SR. Customer care phone: 1800-40-7267864.",
      createdAt: daysAgo(5),
    },
  });

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issue1.id,
        userId: user.id,
        eventType: "created",
        body: "Ticket lodged on Samsung Care portal. Service Request SR-948201 generated.",
        eventAt: daysAgo(5),
      },
      {
        issueId: issue1.id,
        userId: user.id,
        eventType: "call",
        body: "Called support. Agent Ravi confirmed technician will visit by 2 days ago.",
        eventAt: daysAgo(3),
      },
      {
        issueId: issue1.id,
        userId: user.id,
        eventType: "escalation",
        body: "Technician did not arrive on promised date. Status marked as Action Needed.",
        eventAt: daysAgo(1),
      },
    ],
  });

  // Issue 2: Due Soon Telecom Broadband Outage - Priority 3 (Due Soon)
  const issue2 = await prisma.issue.create({
    data: {
      userId: user.id,
      title: "Airtel Xstream: Fiber broadband red LOS light outage (#TT-88310)",
      company: "Airtel",
      category: "telecom",
      referenceNo: "TT-88310",
      description:
        "Complete fiber internet loss since yesterday morning. Router LOS indicator blinking red. Work-from-home impacted.",
      status: "waiting",
      expectedDate: daysFromNow(1), // Due tomorrow!
      nextAction: "Verify fiber connectivity after field engineer splicing visit tomorrow at 11:00 AM.",
      notes: "Account DSL ID: 011-4928172. Engineer contact: 9871234567.",
      createdAt: daysAgo(1),
    },
  });

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issue2.id,
        userId: user.id,
        eventType: "created",
        body: "Automated network check failed. Complaint registered on Airtel Thanks app.",
        eventAt: daysAgo(1),
      },
      {
        issueId: issue2.id,
        userId: user.id,
        eventType: "promise_updated",
        body: "SMS received: Field engineer assigned. Estimated resolution tomorrow before 2 PM.",
        eventAt: daysAgo(0),
      },
    ],
  });

  // Issue 3: Refund Dispute - Action Needed
  const issue3 = await prisma.issue.create({
    data: {
      userId: user.id,
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

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issue3.id,
        userId: user.id,
        eventType: "created",
        body: "Order cancelled, awaiting refund credit.",
        eventAt: daysAgo(8),
      },
      {
        issueId: issue3.id,
        userId: user.id,
        eventType: "email",
        body: "Support sent RRN number. Stated it takes 3-5 days to reflect.",
        eventAt: daysAgo(4),
      },
    ],
  });

  // Issue 4: E-commerce Delivery Delay - Open
  const issue4 = await prisma.issue.create({
    data: {
      userId: user.id,
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

  await prisma.issueEvent.create({
    data: {
      issueId: issue4.id,
      userId: user.id,
      eventType: "created",
      body: "Tracking monitored. Delivery window extended by carrier.",
      eventAt: daysAgo(2),
    },
  });

  // Issue 5: Resolved Issue - Resolved
  const issue5 = await prisma.issue.create({
    data: {
      userId: user.id,
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

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issue5.id,
        userId: user.id,
        eventType: "created",
        body: "Ticket raised via app chat.",
        eventAt: daysAgo(7),
      },
      {
        issueId: issue5.id,
        userId: user.id,
        eventType: "status_change",
        body: "Swiggy issued full refund of INR 340 to wallet. Issue resolved.",
        eventAt: daysAgo(6),
      },
    ],
  });

  console.log("Successfully seeded 5 realistic issues with event histories!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
