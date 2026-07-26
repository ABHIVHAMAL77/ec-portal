// Central place for the allowed values behind our String status fields,
// plus labels/colors used across the UI. Mirrors the company workflow.

export const ACCESS_LEVELS = ["admin", "manager", "member"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "freelancer"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelancer: "Freelancer",
};

// Event lifecycle — the journey a project/tournament takes.
// (Founder/COO create events directly — no pitch/approval step.)
export const EVENT_STAGES = ["planning", "live", "post_review", "closed"] as const;
export type EventStage = (typeof EVENT_STAGES)[number];

export const EVENT_STAGE_LABEL: Record<string, string> = {
  pitched: "Pitched",
  discussion: "Discussion",
  planning: "Planning",
  approved: "Approved",
  live: "Live",
  post_review: "Post Review",
  closed: "Closed",
};

export const EVENT_STAGE_COLOR: Record<string, string> = {
  pitched: "#64748b",
  discussion: "#e0a63a",
  planning: "#d6a43e",
  approved: "#35b06a",
  live: "#e35b52",
  post_review: "#c3cad6",
  closed: "#646d7e",
};

export const APPROVAL_DECISIONS = ["pending", "agree", "needs_discussion"] as const;
export const APPROVAL_LABEL: Record<string, string> = {
  pending: "Pending",
  agree: "Agree",
  needs_discussion: "Needs discussion",
};

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "To-do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const PRIORITY_COLOR: Record<string, string> = {
  low: "#646d7e",
  medium: "#6b8cc4",
  high: "#e0a63a",
  urgent: "#e35b52",
};

export const MEETING_TYPES = ["discussion", "planning", "weekly", "post_review"] as const;
export const MEETING_TYPE_LABEL: Record<string, string> = {
  discussion: "Project Discussion",
  planning: "Project Planning",
  weekly: "Weekly Meeting",
  post_review: "Post-event Review",
};

// The core positions whose sign-off is required to confirm a project.
// (Matched by job role during seeding; the approval board is wired to
// whoever holds these roles.)
export const CORE_APPROVAL_ROLES = [
  "Founder / CEO",
  "Creative Head",
  "PR / Brand Marketing Manager",
  "Executive League Ops",
  "Event Producer",
  "Accountant / Finance Manager",
];

// ---------------------------------------------------------------------------
// Payment portal
// ---------------------------------------------------------------------------

export const PAYMENT_CATEGORIES = [
  "vendor",
  "prize_pool",
  "influencer",
  "salary",
  "freelancer",
  "event",
  "reimbursement",
] as const;
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];

export const PAYMENT_CATEGORY_LABEL: Record<string, string> = {
  vendor: "Vendor / Supplier",
  prize_pool: "Team Prize Pool",
  influencer: "Influencer / Creator",
  salary: "Salary",
  freelancer: "Freelancer",
  event: "Event Payment",
  reimbursement: "Reimbursement",
};

export const PAYMENT_CATEGORY_HINT: Record<string, string> = {
  vendor: "Goods or services supplied to an event or the company.",
  prize_pool: "Prize money for a winning team or player.",
  influencer: "Creator, caster or influencer collaboration fee.",
  salary: "Monthly salary or contracted staff payment.",
  freelancer: "One-off or project-based freelance work.",
  event: "Event-related costs (venue, production, logistics).",
  reimbursement: "Money you spent on the company's behalf.",
};

export const PAYMENT_SCOPES = ["domestic", "international"] as const;
export const PAYMENT_SCOPE_LABEL: Record<string, string> = {
  domestic: "Domestic (India)",
  international: "International",
};

export const PAYEE_TYPES = ["individual", "company"] as const;
export const PAYEE_TYPE_LABEL: Record<string, string> = {
  individual: "Individual",
  company: "Company / Firm",
};

export const PAYMENT_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "on_hold",
  "rejected",
  "paid",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  on_hold: "On hold",
  rejected: "Rejected",
  paid: "Paid",
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  submitted: "#8b95ad",
  under_review: "#6b8cc4",
  approved: "#d6a43e",
  on_hold: "#e0a63a",
  rejected: "#e35b52",
  paid: "#35b06a",
};

// What the payee sees on the public tracking page for each status.
export const PAYMENT_STATUS_PAYEE_MESSAGE: Record<string, string> = {
  submitted: "We've received your submission and it is queued for review.",
  under_review: "Our finance team is verifying your documents and details.",
  approved: "Approved for payment. It will be processed in the next payment run.",
  on_hold: "We need something clarified before we can proceed — see the note below.",
  rejected: "This submission was not approved — see the note below.",
  paid: "Payment has been sent. Your receipt is available below.",
};

export const PAYMENT_DOC_KINDS = [
  "invoice",
  "trc",
  "form10f",
  "no_pe",
  "pan",
  "gst",
  "id_proof",
  "bank_proof",
  "agreement",
  "other",
] as const;

export const PAYMENT_DOC_LABEL: Record<string, string> = {
  invoice: "Invoice",
  trc: "Tax Residence Certificate (TRC)",
  form10f: "Form 10F",
  no_pe: "No-PE Declaration",
  pan: "PAN / Tax ID",
  gst: "GST Certificate",
  id_proof: "ID / Registration Proof",
  bank_proof: "Bank Proof (cancelled cheque / statement)",
  agreement: "Signed Agreement",
  other: "Other",
};

export const PAYMENT_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "NPR"] as const;

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  SGD: "S$",
  AUD: "A$",
  NPR: "Rs ",
};
