import { z } from "zod";

export const IssueCategoryEnum = z.enum([
  "delivery",
  "telecom",
  "warranty",
  "refund",
  "banking",
  "education",
  "government",
  "other",
]);
export type IssueCategory = z.infer<typeof IssueCategoryEnum>;

export const IssueStatusEnum = z.enum([
  "open",
  "waiting",
  "action_needed",
  "resolved",
  "closed",
]);
export type IssueStatus = z.infer<typeof IssueStatusEnum>;

export const CreateIssueSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title cannot exceed 120 characters"),
  company: z
    .string()
    .min(1, "Company / Provider is required")
    .max(120, "Company cannot exceed 120 characters"),
  category: IssueCategoryEnum,
  referenceNo: z.string().max(120, "Reference number cannot exceed 120 characters").optional().nullable(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2,000 characters"),
  expectedDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Expected date must be a valid date"),
  status: IssueStatusEnum.default("open"),
  nextAction: z.string().max(500, "Next action cannot exceed 500 characters").optional().nullable(),
  notes: z.string().max(5000, "Notes cannot exceed 5,000 characters").optional().nullable(),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueSchema = CreateIssueSchema.partial().extend({
  status: IssueStatusEnum.optional(),
});

export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;

export const CreateEventSchema = z.object({
  eventType: z.enum([
    "note",
    "call",
    "email",
    "status_change",
    "promise_updated",
    "technician_visit",
    "escalation",
  ]),
  body: z.string().min(1, "Event description is required").max(2000),
  eventAt: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export interface ExtractionResult {
  title: string | null;
  company: string | null;
  category: IssueCategory;
  reference_number: string | null;
  issue_summary: string | null;
  promised_action: string | null;
  promised_date: string | null;
  status: IssueStatus;
  next_action: string | null;
  confidence_by_field: {
    title: number;
    company: number;
    reference_number: number;
    promised_action: number;
    promised_date: number;
  };
  missing_fields: string[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}

export interface IssueWithDetails {
  id: string;
  userId: string;
  title: string;
  company: string;
  category: IssueCategory;
  referenceNo: string | null;
  description: string;
  status: IssueStatus;
  expectedDate: string | null;
  nextAction: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  isDueSoon?: boolean;
  daysRemaining?: number;
  events?: {
    id: string;
    issueId: string;
    userId: string;
    eventType: string;
    body: string;
    eventAt: string;
    createdAt: string;
  }[];
  attachments?: {
    id: string;
    issueId: string;
    userId: string;
    storagePath: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }[];
}
