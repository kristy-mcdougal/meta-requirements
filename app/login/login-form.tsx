"use client";

import { useState } from "react";
import { signIn } from "@/app/login/actions";

export function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await signIn(new FormData(event.currentTarget));
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form className="panel login-panel" onSubmit={onSubmit}>
      <img className="mark" src="/meta-logo.png" alt="" />
      <div>
        <p className="eyebrow">Meta</p>
        <h1>Meta Knowledge Base Requirements</h1>
      </div>
      <label className="field">
        <span>Password</span>
        <input type="password" name="password" autoFocus required autoComplete="current-password" />
      </label>
      {error ? <p className="inline-error">{error}</p> : null}
      <button className="primary" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
