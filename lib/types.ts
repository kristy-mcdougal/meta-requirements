export type Priority = "YES" | "NO" | "NICE_TO_HAVE";

export type Comment = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type Requirement = {
  id: string;
  title: string;
  body: string;
  category: string;
  sortOrder: number;
  priority: Priority | null;
  decidedBy: string | null;
  addedBy: string | null;
  updatedAt: string;
  comments: Comment[];
};

export const SECTIONS = [
  "Ingestion and structure",
  "Re-ingestion",
  "Tagging and taxonomy",
  "Governance and trust",
  "Delivery",
  "Sales enablement DAM",
  "Measurement",
  "Platform and operations",
] as const;

export const PRIORITY_LABEL: Record<Priority, string> = {
  YES: "Yes",
  NICE_TO_HAVE: "Nice to have",
  NO: "No",
};

export function sectionSlug(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
