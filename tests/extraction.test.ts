import { describe, it, expect } from "vitest";
import { extractIssueFromText } from "../src/lib/extraction";

describe("AI Extraction TRD — Real-world Messy Messages Corpus (16 Cases)", () => {
  const testCases = [
    {
      name: "PRD Example: Refrigerator Repair (TRD 6.3)",
      input:
        "Service request 548921. Technician said he will visit on Tuesday. Refrigerator is still not cooling. Customer care asked me to wait until 12 Sept.",
      expectedCompany: null, // As specified in TRD Section 6.3: "Company: Unknown / user supplied"
      expectedRef: "548921",
      expectedCat: "warranty",
    },
    {
      name: "Airtel Broadband Loss of Signal Outage",
      input:
        "Airtel broadband is completely down. Fiber red light blinking since yesterday. Ticket ID #948210. Called support and they promised engineer visit.",
      expectedCompany: "Airtel",
      expectedRef: "948210",
      expectedCat: "telecom",
    },
    {
      name: "Flipkart Return & Refund Delay",
      input:
        "Returned the dress to Flipkart on Monday. Order ID 40918230. Executive promised refund will be credited in 3 days but nothing yet.",
      expectedCompany: "Flipkart",
      expectedRef: "40918230",
      expectedCat: "refund",
    },
    {
      name: "Blue Dart Package In-Transit Delay",
      input:
        "Courier package via Blue Dart stuck at sorting hub for 4 days. AWB tracking number 8829104. Need immediate delivery attempt.",
      expectedCompany: "Blue Dart",
      expectedRef: "8829104",
      expectedCat: "delivery",
    },
    {
      name: "Swiggy Wrong Meal Delivered",
      input:
        "Ordered pasta from Swiggy, received cold noodles instead. Order #SWIG99281. Waiting for support refund to wallet.",
      expectedCompany: "Swiggy",
      expectedRef: "SWIG99281",
      expectedCat: "refund",
    },
    {
      name: "Uber False Cancellation Fee",
      input:
        "Driver cancelled the trip himself, but Uber charged me a cancellation fee of Rs 50 on my credit card. Trip ref #UBER10294.",
      expectedCompany: "Uber",
      expectedRef: "UBER10294",
      expectedCat: "refund",
    },
    {
      name: "HDFC Bank Duplicate Debit",
      input:
        "POS payment failed at store, but HDFC Bank debited Rs 1,850 twice from my account. Reference no 77291823. Raised dispute with bank.",
      expectedCompany: "HDFC Bank",
      expectedRef: "77291823",
      expectedCat: "banking",
    },
    {
      name: "Amazon Damaged Monitor Return",
      input:
        "Received cracked display monitor from Amazon. Service request 892819. Return pickup promised for tomorrow.",
      expectedCompany: "Amazon",
      expectedRef: "892819",
      expectedCat: "warranty",
    },
    {
      name: "Tata Power Voltage Fluctuation",
      input:
        "Severe voltage spikes in building since 2 PM. Complaint registered with Tata Power docket #TP88391.",
      expectedCompany: "Tata Power",
      expectedRef: "TP88391",
      expectedCat: "government",
    },
    {
      name: "Apple Store Battery Replacement",
      input:
        "Left iPhone at Apple Genius Bar for battery replacement. Repair Work Order #APP90281. Promised pickup by Friday.",
      expectedCompany: "Apple",
      expectedRef: "APP90281",
      expectedCat: "warranty",
    },
    {
      name: "Zomato Missing Beverage",
      input:
        "Zomato delivery order #ZOM88102 arrived without the two iced teas. Chat agent promised refund within 24 hours.",
      expectedCompany: "Zomato",
      expectedRef: "ZOM88102",
      expectedCat: "refund",
    },
    {
      name: "Jio Fiber Fiber Cut",
      input:
        "Jio Fiber broadband disconnected due to road digging cable cut. Ticket no 381920. Restoration expected tomorrow.",
      expectedCompany: "Jio",
      expectedRef: "381920",
      expectedCat: "telecom",
    },
    {
      name: "Delhivery Courier Non-Delivery",
      input:
        "Consignment tracking #DLV99281 via Delhivery marked as 'customer not available' without any delivery attempt.",
      expectedCompany: "Delhivery",
      expectedRef: "DLV99281",
      expectedCat: "delivery",
    },
    {
      name: "SBI Credit Card Unexpected Annual Fee",
      input:
        "SBI charged an annual fee on lifetime free card. Complaint registered with grievance cell ref #SBI491029.",
      expectedCompany: "SBI",
      expectedRef: "SBI491029",
      expectedCat: "banking",
    },
    {
      name: "University Degree Certificate Dispatch",
      input:
        "Applied for duplicate college degree certificate 3 weeks ago. Application #EDU88301. Examination branch asked to wait until next week.",
      expectedCompany: null,
      expectedRef: "EDU88301",
      expectedCat: "education",
    },
    {
      name: "Municipal Water Pipe Burst",
      input:
        "Main drinking water pipeline leaking on 4th cross road. Docket #MUN99210 logged on CPGRAMS civic portal.",
      expectedCompany: null,
      expectedRef: "MUN99210",
      expectedCat: "government",
    },
  ];

  for (const tc of testCases) {
    it(`should correctly extract: ${tc.name}`, async () => {
      const res = await extractIssueFromText(tc.input);

      // Contract checks
      expect(res).toHaveProperty("title");
      expect(res).toHaveProperty("company");
      expect(res).toHaveProperty("category");
      expect(res).toHaveProperty("reference_number");
      expect(res).toHaveProperty("confidence_by_field");

      // Category check
      expect(res.category).toBe(tc.expectedCat);

      // Reference number check
      if (tc.expectedRef) {
        expect(res.reference_number).toContain(tc.expectedRef);
      }

      // Company check
      if (tc.expectedCompany !== undefined) {
        expect(res.company).toBe(tc.expectedCompany);
      }

      // Guardrail check: Title cannot be empty
      expect(res.title).toBeTruthy();
    });
  }

  it("Guardrail test: Never invent reference numbers when absent", async () => {
    const textWithoutRef = "Technician visited my washing machine yesterday and said he will come back next week.";
    const res = await extractIssueFromText(textWithoutRef);

    expect(res.reference_number).toBeNull();
    expect(res.missing_fields).toContain("reference_number");
  });

  it("Guardrail test: Never infer company when not supported by input", async () => {
    const textWithoutCompany = "Delivery delayed for 3 days. Service request #998811.";
    const res = await extractIssueFromText(textWithoutCompany);

    expect(res.company).toBeNull();
    expect(res.missing_fields).toContain("company");
  });

  it("Guardrail regression: Never extract days of the week (like Monday) as company name", async () => {
    // 1. Message with 'from Monday' and no company
    const msg1 = "Technician visit from Monday. Ticket ID 548921. Washing machine still broken.";
    const res1 = await extractIssueFromText(msg1);
    expect(res1.company).toBeNull();
    expect(res1.company).not.toBe("Monday");
    expect(res1.title).not.toContain("Monday:");

    // 2. Message with known company and returned on Monday
    const msg2 = "Flipkart Order OD30192801 returned on Monday. Support promised refund within 3 days.";
    const res2 = await extractIssueFromText(msg2);
    expect(res2.company).toBe("Flipkart");
    expect(res2.company).not.toBe("Monday");

    // 3. Message with 'from Monday morning' and complaint
    const msg3 = "Service complaint from Monday morning. Reference #883921. Still waiting for resolution.";
    const res3 = await extractIssueFromText(msg3);
    expect(res3.company).toBeNull();
    expect(res3.company).not.toBe("Monday");

    // 4. Message with 'Monday support' phrasing
    const msg4 = "Contacted Monday support for ticket #99102. Issue unresolved.";
    const res4 = await extractIssueFromText(msg4);
    expect(res4.company).toBeNull();
    expect(res4.company).not.toBe("Monday");

    // 5. Test all days of the week in conversational context
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of weekdays) {
      const msg = `Issue reported on ${day}. Docket #DOK12345. Waiting for engineer visit on ${day}.`;
      const res = await extractIssueFromText(msg);
      expect(res.company).toBeNull();
      expect(res.company).not.toBe(day);
      expect(res.title).not.toMatch(new RegExp(`^${day}:`));
    }

    // 6. Legitimate brand from email domain should still extract
    const validEmailMsg = "Issue with sound bar. Support ticket #SB9021. Contact care@boat-lifestyle.com for update.";
    const validEmailRes = await extractIssueFromText(validEmailMsg);
    expect(validEmailRes.company).toBe("Boat-lifestyle");

    // 7. Legitimate brand from team greeting should still extract
    const teamGreetingMsg = "Your booking #TRIP88102 is confirmed. Regards, Team Ixigo.";
    const teamGreetingRes = await extractIssueFromText(teamGreetingMsg);
    expect(teamGreetingRes.company).toBe("Ixigo");
  });
});
