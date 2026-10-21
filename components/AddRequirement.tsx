"use client";

import { useMemo, useState } from "react";
import { addRequirement } from "@/app/actions";
import type { Priority, Requirement } from "@/lib/types";
import { PRIORITY_LABEL, SECTIONS } from "@/lib/types";

const SECTION_SET = new Set<string>(SECTIONS);

const CHOICES: Priority[] = ["YES", "NICE_TO_HAVE", "NO"];

export function AddRequirement({
  name,
  sections,
  onNeedName,
  onCreated,
}: {
  name: string;
  sections: string[];
  onNeedName: () => void;
  onCreated: (requirement: Requirement) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(SECTIONS[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const choices = useMemo(() => {
    const extra = sections.filter((section) => !SECTION_SET.has(section));
    return [...SECTIONS, ...extra, "New section"];
  }, [sections]);

  const resolvedCategory = category === "New section" ? customCategory.trim() : category;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      onNeedName();
      return;
    }
    setSaving(true);
    setError("");
    const result = await addRequirement({
      title,
      body,
      category: resolvedCategory,
      name,
      priority,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated(result.data);
    setTitle("");
    setBody("");
    setPriority(null);
    setCustomCategory("");
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="panel">
        <div className="panel-head">
          <h2>Add a requirement</h2>
          <button className="primary" type="button" onClick={() => setOpen(true)}>
            Add
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-head">
        <h2>Add a requirement</h2>
        <button className="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      <div className="fields">
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={180} />
        </label>
        <label className="field">
          <span>Details</span>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={4} maxLength={5000} />
        </label>
        <div className="field">
          <span>Section</span>
          <div className="section-picks" role="radiogroup" aria-label="Section">
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={choice === category ? "chip is-on" : "chip"}
                role="radio"
                aria-checked={choice === category}
                onClick={() => setCategory(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
          {category === "New section" ? (
            <input
              aria-label="New section name"
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
              required
              maxLength={80}
              placeholder="Section name"
            />
          ) : null}
        </div>
        <div className="field">
          <span>Decision</span>
          <div className="choices" role="radiogroup" aria-label="Decision">
            {CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={priority === choice}
                className={priority === choice ? `choice is-${choice === "YES" ? "yes" : choice === "NO" ? "no" : "nice"}` : "choice"}
                onClick={() => setPriority(priority === choice ? null : choice)}
              >
                {PRIORITY_LABEL[choice]}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="inline-error">{error}</p> : null}
        <button className="primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save requirement"}
        </button>
      </div>
    </form>
  );
}
