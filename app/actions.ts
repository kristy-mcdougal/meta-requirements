"use server";

import { revalidatePath } from "next/cache";
import {
  addComment,
  createRequirement,
  getRequirements,
  setRequirementPriority,
} from "@/lib/requirements";
import type { Priority, Requirement } from "@/lib/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function failure(error: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong.",
  };
}

function cleanName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter your name first.");
  if (trimmed.length > 80) throw new Error("Name must be 80 characters or fewer.");
  return trimmed;
}

export async function fetchRequirements(): Promise<ActionResult<Requirement[]>> {
  try {
    return { ok: true, data: await getRequirements() };
  } catch (error) {
    return failure(error);
  }
}

export async function choosePriority(
  id: string,
  priority: Priority | null,
  name: string,
): Promise<ActionResult<Requirement>> {
  try {
    const decidedBy = priority ? cleanName(name) : null;
    const requirement = await setRequirementPriority(id, priority, decidedBy);
    revalidatePath("/");
    return { ok: true, data: requirement };
  } catch (error) {
    return failure(error);
  }
}

export async function postComment(
  requirementId: string,
  body: string,
  name: string,
): Promise<ActionResult<Requirement>> {
  try {
    const authorName = cleanName(name);
    const text = body.trim();
    if (!text) throw new Error("Write a comment before posting.");
    if (text.length > 2000) throw new Error("Comments must be 2000 characters or fewer.");
    await addComment(requirementId, text, authorName);
    const requirements = await getRequirements();
    const requirement = requirements.find((item) => item.id === requirementId);
    if (!requirement) throw new Error("The requirement could not be reloaded.");
    revalidatePath("/");
    return { ok: true, data: requirement };
  } catch (error) {
    return failure(error);
  }
}

export async function addRequirement(input: {
  title: string;
  body: string;
  category: string;
  name: string;
  priority: Priority | null;
}): Promise<ActionResult<Requirement>> {
  try {
    const addedBy = cleanName(input.name);
    const title = input.title.trim();
    const body = input.body.trim();
    const category = input.category.trim();
    if (!title || !body || !category) {
      throw new Error("Title, details, and section are required.");
    }
    const requirement = await createRequirement({
      title,
      body,
      category,
      addedBy,
      priority: input.priority,
    });
    revalidatePath("/");
    return { ok: true, data: requirement };
  } catch (error) {
    return failure(error);
  }
}
