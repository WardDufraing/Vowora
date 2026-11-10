"use client";

import { useState } from "react";

import type { OrganizationMember } from "@vowora/contracts";
import type { organizationMessages } from "../../../../lib/organization-messages";

export function StaffList({
  initial,
  messages,
  organizationId,
}: {
  readonly initial: readonly OrganizationMember[];
  readonly messages: ReturnType<typeof organizationMessages>;
  readonly organizationId: string;
}) {
  const [members, setMembers] = useState(initial);
  const [error, setError] = useState("");
  async function deactivate(id: string) {
    setError("");
    const response = await fetch(
      `/api/v1/organizations/${organizationId}/staff/${id}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setError(messages.error);
      return;
    }
    setMembers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, status: "revoked" } : member,
      ),
    );
  }
  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      {members.length === 0 ? (
        <p>{messages.empty}</p>
      ) : (
        <ul className="shared-list">
          {members.map((member) => (
            <li key={member.id}>
              <span>
                <strong>{member.name}</strong> · {member.email} ·{" "}
                {messages[member.role]} · {messages[member.status]}
              </span>
              {member.role !== "owner" && member.status === "active" ? (
                <button
                  type="button"
                  onClick={() => void deactivate(member.id)}
                >
                  {messages.deactivate}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
