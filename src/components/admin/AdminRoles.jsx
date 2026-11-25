import React, { useState } from "react";
import { ShieldCheck, Key, Check, Lock, UserCheck, Info } from "lucide-react";

export default function AdminRoles({
  rolesData,
  onAssignRole,
  usersList = [],
  loading,
}) {
  const [selectedUid, setSelectedUid] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);

  const defaultRoles = [
    {
      key: "admin",
      title: "Enterprise Admin",
      description: "Full system administration, IAM policy management, user provisioning, and audit oversight.",
      badge: "Highest Privilege",
      color: "var(--adm-link)",
      bgColor: "var(--adm-accent-soft)",
      borderColor: "var(--adm-accent-border)",
      permissions: [
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "roles.view",
        "roles.manage",
        "sessions.view",
        "sessions.revoke",
        "audit.view",
        "settings.manage",
      ],
    },
    {
      key: "user",
      title: "End User",
      description: "Standard workspace identity with personal security settings and connected OAuth apps.",
      badge: "Standard Access",
      color: "var(--adm-ok-text)",
      bgColor: "var(--adm-ok-bg)",
      borderColor: "var(--adm-ok-border)",
      permissions: ["users.view"],
    },
  ];

  const liveCounts = Object.fromEntries(
    (rolesData?.roles || []).map((r) => [r.key, r.count])
  );

  const allPermissions = [
    { key: "users.view", category: "Users" },
    { key: "users.create", category: "Users" },
    { key: "users.edit", category: "Users" },
    { key: "users.delete", category: "Users" },
    { key: "roles.view", category: "RBAC" },
    { key: "roles.manage", category: "RBAC" },
    { key: "sessions.view", category: "Sessions" },
    { key: "sessions.revoke", category: "Sessions" },
    { key: "audit.view", category: "Security" },
    { key: "settings.manage", category: "System" },
  ];

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUid) return;
    setSubmitting(true);
    try {
      await onAssignRole(Number(selectedUid), selectedRole);
      setSelectedUid("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
          Roles &amp; permissions
        </h1>
        <p style={{ margin: "4px 0 0", color: "var(--adm-text-2)", fontSize: "13px" }}>
          Server-enforced privilege levels, permission matrix, and user role assignments.
        </p>
      </div>

      {/* Role Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "16px" }}>
        {defaultRoles.map((role) => (
          <div
            key={role.key}
            className="card"
            style={{ border: `1px solid ${role.borderColor}`, borderRadius: "12px", padding: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: role.bgColor, display: "grid", placeItems: "center" }}>
                <ShieldCheck size={18} color={role.color} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px", background: role.bgColor, color: role.color }}>
                {role.badge}
              </span>
            </div>

            <h2 style={{ fontSize: "15.5px", fontWeight: 700, color: "var(--adm-text)", margin: 0 }}>
              {role.title}
              {typeof liveCounts[role.key] === "number" && (
                <span style={{ fontSize: "12px", color: "var(--adm-text-2)", fontWeight: 500, marginLeft: "8px" }}>
                  ({liveCounts[role.key]} users)
                </span>
              )}
            </h2>
            <p style={{ fontSize: "12.5px", color: "var(--adm-text-2)", margin: "6px 0 14px", lineHeight: 1.5 }}>
              {role.description}
            </p>

            <div style={{ borderTop: "1px solid var(--adm-border-soft)", paddingTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {role.permissions.map((perm) => (
                <span
                  key={perm}
                  style={{
                    fontSize: "11.5px",
                    fontFamily: "monospace",
                    padding: "2px 7px",
                    borderRadius: "6px",
                    background: "var(--adm-input)",
                    color: "var(--adm-text)",
                    border: "1px solid var(--adm-border-strong)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Check size={10} color="#4ade80" />
                  {perm}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Role Assign + Matrix */}
      <div className="vw-two-col">
        <div className="card" style={{ borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Key size={16} color="var(--adm-link)" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--adm-text)" }}>Assign role</h2>
          </div>
          <p style={{ fontSize: "12.5px", color: "var(--adm-text-2)", marginBottom: "16px", lineHeight: 1.45 }}>
            Select a directory user and save role changes validated by the backend API.
          </p>

          <form onSubmit={handleRoleSubmit} style={{ display: "grid", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                Target user
              </label>
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                required
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", padding: "0 10px", fontSize: "13px", background: "var(--adm-input)", color: "var(--adm-text)" }}
              >
                <option value="">-- Choose user --</option>
                {usersList.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    #{u.uid} - {u.full_name || u.username} ({u.email}) [{u.role}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--adm-text-2)", marginBottom: "5px" }}>
                Role assignment
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: "100%", height: "38px", borderRadius: "8px", border: "1px solid var(--adm-border-strong)", padding: "0 10px", fontSize: "13px", background: "var(--adm-input)", color: "var(--adm-text)" }}
              >
                <option value="user">End User (Member)</option>
                <option value="admin">Enterprise Admin</option>
              </select>
            </div>

            <div style={{ padding: "9px 12px", background: "var(--adm-ok-bg)", border: "1px solid var(--adm-ok-border)", borderRadius: "8px", fontSize: "12px", color: "var(--adm-ok-text)", display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>The backend prevents demoting the last remaining administrator account.</span>
            </div>

            <button type="submit" disabled={!selectedUid || submitting || loading} className="btn" style={{ height: "38px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px" }}>
              <UserCheck size={15} />
              <span>{submitting ? "Saving..." : "Save role assignment"}</span>
            </button>
          </form>
        </div>

        <div className="card" style={{ borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Lock size={16} color="var(--adm-link)" />
            <h2 style={{ fontSize: "15px", fontWeight: 600, margin: 0, color: "var(--adm-text)" }}>Permission matrix</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--adm-border)", textAlign: "left", color: "var(--adm-text-2)" }}>
                  <th style={{ padding: "8px 10px", fontWeight: 600 }}>Permission</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600 }}>Scope</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600, textAlign: "center" }}>Admin</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600, textAlign: "center" }}>Member</th>
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((p) => (
                  <tr key={p.key} style={{ borderBottom: "1px solid var(--adm-border-soft)" }}>
                    <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "var(--adm-text)", fontWeight: 600 }}>{p.key}</td>
                    <td style={{ padding: "8px 10px", color: "var(--adm-text-2)" }}>{p.category}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", color: "var(--adm-ok-text)", fontWeight: 700 }}>✓</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", color: p.key === "users.view" ? "#4ade80" : "#52525b", fontWeight: 700 }}>
                      {p.key === "users.view" ? "✓" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
