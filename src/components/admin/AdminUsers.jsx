import React, { useState } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
} from "lucide-react";

export default function AdminUsers({
  users = [],
  total = 0,
  totalPages = 1,
  page = 1,
  search = "",
  roleFilter = "all",
  statusFilter = "all",
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onOpenAddUser,
  onOpenEditUser,
  onToggleStatus,
  onDeleteUser,
  currentAdminUid,
  loading,
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  return (
    <div className="admin-page-container" style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
            Users
          </h1>
          <p style={{ margin: "4px 0 0", color: "#a1a1aa", fontSize: "13px" }}>
            Manage registered accounts, provision credentials, assign roles, and update access state.
          </p>
        </div>

        <button
          onClick={onOpenAddUser}
          className="btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 14px",
            height: "36px",
            fontSize: "12.5px",
            cursor: "pointer",
          }}
        >
          <UserPlus size={14} />
          <span>Add user</span>
        </button>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          borderRadius: "10px",
          padding: "14px 16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} color="#71717a" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                height: "36px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "8px",
                border: "1px solid #262626",
                background: "#000000",
                fontSize: "13px",
                color: "#ffffff",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} color="#71717a" />
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              style={{
                height: "36px",
                padding: "0 10px",
                borderRadius: "8px",
                border: "1px solid #262626",
                fontSize: "12.5px",
                backgroundColor: "#000000",
                color: "#e4e4e7",
                cursor: "pointer",
              }}
            >
              <option value="all">All roles</option>
              <option value="admin">Administrator</option>
              <option value="user">Member</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              height: "36px",
              padding: "0 10px",
              borderRadius: "8px",
              border: "1px solid #262626",
              fontSize: "12.5px",
              backgroundColor: "#000000",
              color: "#e4e4e7",
              cursor: "pointer",
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
          Showing <strong style={{ color: "#ffffff" }}>{users.length}</strong> of{" "}
          <strong style={{ color: "#ffffff" }}>{total}</strong> users
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#111111", borderBottom: "1px solid #1f1f1f", color: "#71717a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>UID</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>User</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Email</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "11px 16px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "11px 16px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "38px 16px", color: "#71717a" }}>
                    Loading directory accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "44px 16px", color: "#71717a" }}>
                    <User size={30} style={{ margin: "0 auto 8px", color: "#52525b" }} />
                    <p style={{ margin: 0 }}>No users match your filter.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = (u.role || "").toLowerCase().includes("admin");
                  const isActive = u.is_active !== false;
                  const isSelf = u.uid === currentAdminUid;

                  return (
                    <tr key={u.uid} style={{ borderBottom: "1px solid #141414" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#a1a1aa", fontWeight: 600 }}>
                        #{u.uid}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: isAdmin ? "rgba(247, 215, 148, 0.16)" : "#141414",
                              border: `1px solid ${isAdmin ? "rgba(247, 215, 148, 0.4)" : "#262626"}`,
                              color: isAdmin ? "#F7D794" : "#d4d4d8",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 700,
                              fontSize: "12px",
                              flexShrink: 0,
                            }}
                          >
                            {(u.full_name || u.username || "U").substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#ffffff" }}>
                              {u.full_name || u.username}
                              {isSelf && (
                                <span style={{ marginLeft: "6px", fontSize: "10.5px", color: "#000000", background: "#F7D794", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#71717a" }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#d4d4d8" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 9px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            background: isAdmin ? "rgba(247, 215, 148, 0.14)" : "#141414",
                            border: `1px solid ${isAdmin ? "rgba(247, 215, 148, 0.35)" : "#262626"}`,
                            color: isAdmin ? "#F7D794" : "#d4d4d8",
                          }}
                        >
                          {isAdmin ? <Shield size={11} /> : <User size={11} />}
                          {u.role_title || (isAdmin ? "Administrator" : "Member")}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "2px 9px",
                            borderRadius: "6px",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            background: isActive ? "rgba(34, 197, 94, 0.14)" : "rgba(239, 68, 68, 0.14)",
                            border: `1px solid ${isActive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.35)"}`,
                            color: isActive ? "#4ade80" : "#f87171",
                          }}
                        >
                          {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#a1a1aa", fontSize: "12px" }}>{u.c_date || "—"}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View Details"
                            style={{ background: "#000000", border: "1px solid #262626", borderRadius: "6px", padding: "5px 7px", cursor: "pointer", color: "#a1a1aa" }}
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => onOpenEditUser(u)}
                            title="Edit User"
                            style={{ background: "#000000", border: "1px solid rgba(247, 215, 148, 0.35)", borderRadius: "6px", padding: "5px 7px", cursor: "pointer", color: "#F7D794" }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onToggleStatus(u.uid, !isActive)}
                            disabled={isSelf}
                            title={isActive ? "Deactivate Account" : "Activate Account"}
                            style={{
                              background: "#000000",
                              border: `1px solid ${isActive ? "rgba(247, 215, 148, 0.35)" : "rgba(34, 197, 94, 0.35)"}`,
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              color: isActive ? "#F7D794" : "#4ade80",
                              opacity: isSelf ? 0.4 : 1,
                            }}
                          >
                            {isActive ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete own account" : "Delete User"}
                            style={{
                              background: "#000000",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              color: "#f87171",
                              opacity: isSelf ? 0.4 : 1,
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #171717",
            background: "#050505",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
            Page <strong style={{ color: "#ffffff" }}>{page}</strong> of{" "}
            <strong style={{ color: "#ffffff" }}>{totalPages || 1}</strong>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn--ghost" style={{ height: "30px", padding: "0 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <ChevronLeft size={13} /> Previous
            </button>
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn--ghost" style={{ height: "30px", padding: "0 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedUser && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.78)", display: "grid", placeItems: "center", zIndex: 100, padding: "16px" }}
          onClick={() => setSelectedUser(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "24px", borderRadius: "12px", border: "1px solid #262626" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>{selectedUser.full_name || selectedUser.username}</h3>
                <div style={{ fontSize: "12px", color: "#a1a1aa" }}>UID #{selectedUser.uid} · @{selectedUser.username}</div>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#a1a1aa" }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: "8px", marginBottom: "18px", fontSize: "13px" }}>
              {[
                ["Email", selectedUser.email],
                ["Phone", selectedUser.phone || "Not set"],
                ["Role", selectedUser.role_title || selectedUser.role],
                ["Status", selectedUser.is_active !== false ? "Active" : "Deactivated"],
                ["Created", selectedUser.c_date || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: "9px 12px", background: "#000000", border: "1px solid #1f1f1f", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#a1a1aa" }}>{k}</span>
                  <strong style={{ color: "#ffffff" }}>{v}</strong>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button className="btn btn--ghost" onClick={() => setSelectedUser(null)} style={{ height: "36px", padding: "0 14px", cursor: "pointer" }}>Close</button>
              <button
                className="btn"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  onOpenEditUser(target);
                }}
                style={{ height: "36px", padding: "0 14px", cursor: "pointer" }}
              >
                Edit user
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmUser && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.78)", display: "grid", placeItems: "center", zIndex: 100, padding: "16px" }}
          onClick={() => setDeleteConfirmUser(null)}
        >
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "24px", borderRadius: "12px", border: "1px solid #262626", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.16)", color: "#f87171", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px", color: "#ffffff" }}>Delete user permanently?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#a1a1aa", lineHeight: 1.5 }}>
              Delete <strong style={{ color: "#ffffff" }}>"{deleteConfirmUser.username}"</strong> (#{deleteConfirmUser.uid}) and revoke all sessions and logs?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn--ghost" onClick={() => setDeleteConfirmUser(null)} style={{ flex: 1, height: "38px", cursor: "pointer" }}>Cancel</button>
              <button
                className="btn"
                onClick={() => {
                  const uid = deleteConfirmUser.uid;
                  setDeleteConfirmUser(null);
                  onDeleteUser(uid);
                }}
                style={{ flex: 1, height: "38px", background: "#dc2626", borderColor: "#dc2626", color: "#ffffff", cursor: "pointer" }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
