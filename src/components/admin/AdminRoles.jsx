import React, { useState } from "react";
import {
  ShieldCheck,
  Shield,
  User,
  Key,
  Check,
  Lock,
  ArrowRight,
  UserCheck,
  Info,
} from "lucide-react";

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
      color: "#7047eb",
      bgColor: "#f5f3ff",
      borderColor: "#ddd6fe",
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
      description: "Standard employee SSO credential with access to personal security settings and connected apps.",
      badge: "Standard Access",
      color: "#16a34a",
      bgColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      permissions: ["users.view"],
    },
  ];

  const liveCounts = Object.fromEntries(
    (rolesData?.roles || []).map((r) => [r.key, r.count])
  );

  const allPermissions = [
    { key: "users.view", label: "View User Directory", category: "Users" },
    { key: "users.create", label: "Provision New Users", category: "Users" },
    { key: "users.edit", label: "Modify User Records", category: "Users" },
    { key: "users.delete", label: "Permanently Delete Users", category: "Users" },
    { key: "roles.view", label: "Inspect RBAC Hierarchy", category: "RBAC" },
    { key: "roles.manage", label: "Reassign IAM Roles", category: "RBAC" },
    { key: "sessions.view", label: "Inspect Global Sessions", category: "Sessions" },
    { key: "sessions.revoke", label: "Revoke Active Sessions", category: "Sessions" },
    { key: "audit.view", label: "Read Security Audit Logs", category: "Security" },
    { key: "settings.manage", label: "Modify System Settings", category: "System" },
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
    <div className="admin-page-container" style={{ display: "grid", gap: "24px" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          Role-Based Access Control (RBAC)
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
          Server-side enforced privilege layers, granular capability mappings, and atomic role delegations.
        </p>
      </div>

      {/* Role Hierarchy Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "18px" }}>
        {defaultRoles.map((role) => (
          <div
            key={role.key}
            style={{
              background: "#ffffff",
              border: `1px solid ${role.borderColor}`,
              borderRadius: "14px",
              padding: "22px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: role.bgColor,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ShieldCheck size={20} color={role.color} />
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "9999px",
                    backgroundColor: role.bgColor,
                    color: role.color,
                    border: `1px solid ${role.borderColor}`,
                  }}
                >
                  {role.badge}
                </span>
              </div>

              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", margin: 0 }}>
                {role.title}
                {typeof liveCounts[role.key] === "number" && (
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500, marginLeft: "8px" }}>
                    ({liveCounts[role.key]} users)
                  </span>
                )}
              </h2>
              <p style={{ fontSize: "0.83rem", color: "#64748b", margin: "6px 0 16px", lineHeight: 1.45 }}>
                {role.description}
              </p>

              {/* Granted permissions */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "10px" }}>
                  Granted Capabilities ({role.permissions.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {role.permissions.map((perm) => (
                    <span
                      key={perm}
                      style={{
                        fontSize: "0.74rem",
                        fontFamily: "monospace",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: "#f8fafc",
                        color: "#334155",
                        border: "1px solid #e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Check size={11} color="#16a34a" />
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Assignment Form & Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.8fr)", gap: "20px" }}>
        {/* Assign Role to User Widget */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Key size={18} color="#7047eb" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Assign Role to User
            </h2>
          </div>
          <p style={{ fontSize: "0.83rem", color: "#64748b", marginBottom: "18px", lineHeight: 1.45 }}>
            Select an active user from your directory and apply new authorization privileges. Changes take effect on the user's next request.
          </p>

          <form onSubmit={handleRoleSubmit} style={{ display: "grid", gap: "14px" }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                Target User
              </label>
              <select
                value={selectedUid}
                onChange={(e) => setSelectedUid(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 12px",
                  fontSize: "0.88rem",
                  backgroundColor: "#fff",
                  color: "#111827",
                  outline: "none",
                }}
              >
                <option value="">-- Choose User Account --</option>
                {usersList.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    #{u.uid} - {u.full_name || u.username} ({u.email}) [Current: {u.role}]
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ margin: 0 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                New Role Assignment
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  borderRadius: "8px",
                  border: "1.5px solid #d1d5db",
                  padding: "0 12px",
                  fontSize: "0.88rem",
                  backgroundColor: "#fff",
                  color: "#111827",
                  outline: "none",
                }}
              >
                <option value="user">End User (Standard Access)</option>
                <option value="admin">Enterprise Admin (Full System Privileges)</option>
              </select>
            </div>

            <div
              style={{
                padding: "10px 12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#166534",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <Info size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                Lockout Protection: The backend will reject demoting the last remaining administrator account.
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedUid || submitting}
              className="btn"
              style={{
                height: "42px",
                marginTop: "4px",
                background: "linear-gradient(135deg, #7047eb, #4f46e5)",
                fontSize: "0.88rem",
              }}
            >
              <UserCheck size={16} />
              <span>{submitting ? "Updating Role..." : "Save Role Assignment"}</span>
            </button>
          </form>
        </div>

        {/* Permissions Dictionary */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <Lock size={18} color="#475569" />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "#111827" }}>
              Granular Permission Matrix
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "8px 10px", fontWeight: 600 }}>Permission Key</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600 }}>Category</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600, textAlign: "center" }}>Admin</th>
                  <th style={{ padding: "8px 10px", fontWeight: 600, textAlign: "center" }}>User</th>
                </tr>
              </thead>
              <tbody>
                {allPermissions.map((p) => {
                  const hasAdmin = true;
                  const hasUser = p.key === "users.view";

                  return (
                    <tr key={p.key} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 10px", fontFamily: "monospace", color: "#1e293b", fontWeight: 600 }}>
                        {p.key}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#64748b" }}>
                        {p.category}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        {hasUser ? (
                          <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
