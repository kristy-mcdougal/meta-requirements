"use client";

import { useState } from "react";
import { choosePriority, postComment } from "@/app/actions";
import type { Priority, Requirement } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/types";

const CHOICES: Priority[] = ["YES", "NICE_TO_HAVE", "NO"];

function choiceClass(priority: Priority | null, choice: Priority) {
  if (priority !== choice) return "choice";
  if (choice === "YES") return "choice is-yes";
  if (choice === "NO") return "choice is-no";
  return "choice is-nice";
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RequirementCard({
  requirement,
  name,
  onNeedName,
  onChange,
}: {
  requirement: Requirement;
  name: string;
  onNeedName: () => void;
  onChange: (requirement: Requirement) => void;
}) {
  const [savingChoice, setSavingChoice] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [error, setError] = useState("");

  const tone =
    requirement.priority === "YES"
      ? "is-yes"
      : requirement.priority === "NICE_TO_HAVE"
        ? "is-nice"
        : requirement.priority === "NO"
          ? "is-no"
          : "is-open";

  async function select(choice: Priority) {
    if (!name.trim()) {
      onNeedName();
      return;
    }
    const next = requirement.priority === choice ? null : choice;
    setSavingChoice(true);
    setError("");
    const result = await choosePriority(requirement.id, next, name);
    setSavingChoice(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.data);
  }

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      onNeedName();
      return;
    }
    setPosting(true);
    setError("");
    const result = await postComment(requirement.id, comment, name);
    setPosting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setComment("");
    onChange(result.data);
  }

  return (
    <article className={`card ${tone}`} id={`requirement-${requirement.id}`}>
      <h3>{requirement.title}</h3>
      <p className="body">{requirement.body}</p>
      <div className="choices" role="radiogroup" aria-label={`Decision for ${requirement.title}`}>
        {CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            className={choiceClass(requirement.priority, choice)}
            aria-pressed={requirement.priority === choice}
            disabled={savingChoice}
            onClick={() => select(choice)}
          >
            {PRIORITY_LABEL[choice]}
          </button>
        ))}
      </div>
      <div className="card-foot">
        <p className="decision">
          {requirement.priority
            ? `${requirement.decidedBy ?? "Someone"} · ${PRIORITY_LABEL[requirement.priority]}`
            : requirement.addedBy
              ? `Added by ${requirement.addedBy}`
              : ""}
        </p>
        <button className="link-button" type="button" onClick={() => setCommentsOpen((open) => !open)}>
          {requirement.comments.length
            ? `${requirement.comments.length} comment${requirement.comments.length === 1 ? "" : "s"}`
            : "Comment"}
        </button>
      </div>
      {commentsOpen ? (
        <div className="comments">
          {requirement.comments.map((item) => (
            <div className="comment" key={item.id}>
              <strong>{item.authorName}</strong>
              <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
              <p>{item.body}</p>
            </div>
          ))}
          <form className="composer" onSubmit={submitComment}>
            <input
              aria-label={`Comment on ${requirement.title}`}
              placeholder="Add a comment"
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
            />
            <button className="primary" type="submit" disabled={posting || !comment.trim()}>
              {posting ? "Posting…" : "Post"}
            </button>
          </form>
        </div>
      ) : null}
      {error ? <p className="inline-error">{error}</p> : null}
    </article>
  );
}
