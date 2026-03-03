"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { loginAction } from "@/lib/actions";

type LoginFormProps = {
  members: Array<{ id: string; name: string; businessName: string }>;
  error?: string;
};

export function LoginForm({ members, error }: LoginFormProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return members;
    }
    return members.filter((member) => `${member.name} ${member.businessName}`.toLowerCase().includes(value));
  }, [members, query]);

  return (
    <div className="card stack">
      <div>
        <h1 className="sectionTitle" style={{ fontSize: "1.3rem" }}>
          Member login
        </h1>
        <p className="muted">Pick your name, enter your PIN, and you stay signed in for around 90 days.</p>
      </div>
      {error ? <div className="dangerButton smallText">{error}</div> : null}
      <form action={loginAction} className="formGrid">
        <label className="label">
          Search members
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 12, top: 14, color: "#5b6c82" }} />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Start typing a name"
            />
          </div>
        </label>

        <label className="label">
          Member
          <select className="select" name="memberId" required defaultValue="">
            <option value="" disabled>
              Choose your name
            </option>
            {filtered.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} - {member.businessName}
              </option>
            ))}
          </select>
        </label>

        <label className="label">
          PIN
          <input className="input" name="pin" type="password" inputMode="numeric" minLength={4} required />
        </label>

        <button className="primaryButton" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}
