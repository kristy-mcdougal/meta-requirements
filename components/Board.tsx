"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRequirements } from "@/app/actions";
import { AddRequirement } from "@/components/AddRequirement";
import { RequirementCard } from "@/components/RequirementCard";
import type { Priority, Requirement } from "@/lib/types";
import { SECTIONS, sectionSlug } from "@/lib/types";

const SECTION_SET = new Set<string>(SECTIONS);

const NAME_KEY = "meta-requirements-reviewer";
const FILTERS: { id: "ALL" | "OPEN" | Priority; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "YES", label: "Yes" },
  { id: "NICE_TO_HAVE", label: "Nice to have" },
  { id: "NO", label: "No" },
];

export function Board({ initialRequirements }: { initialRequirements: Requirement[] }) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [name, setName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [activeSection, setActiveSection] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(NAME_KEY) ?? "";
    setName(saved);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (dirty.current) return;
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      const result = await fetchRequirements();
      if (result.ok) setRequirements(result.data);
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  function updateName(value: string) {
    setName(value);
    window.localStorage.setItem(NAME_KEY, value);
    if (value.trim()) setNeedsName(false);
  }

  function replace(next: Requirement) {
    dirty.current = true;
    setRequirements((current) => {
      const exists = current.some((item) => item.id === next.id);
      const updated = exists ? current.map((item) => (item.id === next.id ? next : item)) : [...current, next];
      return updated.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    window.setTimeout(() => {
      dirty.current = false;
    }, 2000);
  }

  function askForName() {
    setNeedsName(true);
    nameRef.current?.focus();
  }

  const sections = useMemo(() => {
    const present = new Set(requirements.map((item) => item.category));
    const ordered = SECTIONS.filter((section) => present.has(section));
    const extras = Array.from(present).filter((section) => !SECTION_SET.has(section));
    return [...ordered, ...extras];
  }, [requirements]);

  const visible = useMemo(() => {
    return requirements.filter((item) => {
      return (
        filter === "ALL" ||
        (filter === "OPEN" ? item.priority === null : item.priority === filter)
      );
    });
  }, [requirements, filter]);

  const counts = {
    yes: requirements.filter((item) => item.priority === "YES").length,
    nice: requirements.filter((item) => item.priority === "NICE_TO_HAVE").length,
    no: requirements.filter((item) => item.priority === "NO").length,
    open: requirements.filter((item) => item.priority === null).length,
  };
  const decided = requirements.length - counts.open;
  const progress = requirements.length ? Math.round((decided / requirements.length) * 100) : 0;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="mark" src="/meta-logo.png" alt="" />
          <div>
            <p className="eyebrow">Meta</p>
            <h1>Meta Knowledge Base Requirements</h1>
          </div>
        </div>
        <div className="name-box">
          <label htmlFor="reviewer-name">Your name</label>
          <input
            id="reviewer-name"
            ref={nameRef}
            className={needsName ? "is-error" : ""}
            value={name}
            placeholder="Alex Morgan"
            maxLength={80}
            onChange={(event) => updateName(event.target.value)}
          />
          {needsName ? <p className="hint">Enter your name to record a decision or comment.</p> : null}
        </div>
      </header>
      <div className="shell">
        <nav className="sidenav" aria-label="Sections">
          {sections.map((section) => {
            const open = requirements.filter((item) => item.category === section && item.priority === null).length;
            return (
              <button
                key={section}
                type="button"
                className={activeSection === section ? "is-active" : ""}
                onClick={() => {
                  setActiveSection(section);
                  document.getElementById(`section-${sectionSlug(section)}`)?.scrollIntoView({ block: "start" });
                }}
              >
                <strong>{section}</strong>
                <span>{open} open</span>
              </button>
            );
          })}
        </nav>
        <main>
          <div className="stats" aria-label="Decision summary">
            <div className="stat"><b>{counts.yes}</b><span>Yes</span></div>
            <div className="stat"><b>{counts.nice}</b><span>Nice to have</span></div>
            <div className="stat"><b>{counts.no}</b><span>No</span></div>
            <div className="stat"><b>{counts.open}</b><span>Open</span></div>
          </div>
          <div className="progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
          <p className="meta-line">{decided} of {requirements.length} decided</p>
          <div className="toolbar">
            <div className="chips" role="radiogroup" aria-label="Filter by decision">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={filter === item.id}
                  className={filter === item.id ? "chip is-on" : "chip"}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <AddRequirement
            name={name}
            sections={sections}
            onNeedName={askForName}
            onCreated={replace}
          />
          {visible.length === 0 ? <div className="empty">Nothing matches that filter.</div> : null}
          {sections.map((section) => {
            const items = visible.filter((item) => item.category === section);
            if (!items.length) return null;
            return (
              <section className="section" id={`section-${sectionSlug(section)}`} key={section}>
                <h2>{section}</h2>
                <div className="stack">
                  {items.map((requirement) => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      name={name}
                      onNeedName={askForName}
                      onChange={replace}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </>
  );
}
