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
  Phone,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function AdminUsers({
  users = [],
  total = 0,
  page = 1,
  perPage = 20,
  totalPages = 1,
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
    <div className="admin-page-container" style={{ display: "grid", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#111827", margin: 0 }}>
            User Directory &amp; Access Control
          </h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.86rem" }}>
            Manage registered employee accounts, provision credentials, enforce roles and deactivate access.
          </p>
        </div>

        <button
          onClick={onOpenAddUser}
          className="btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            height: "40px",
            fontSize: "0.88rem",
            background: "linear-gradient(135deg, #7047eb, #4f46e5)",
            boxShadow: "0 4px 14px rgba(112, 71, 235, 0.35)",
          }}
        >
          <UserPlus size={16} />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "16px",
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px", flexWrap: "wrap" }}>
          {/* Search box */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search
              size={16}
              color="#9ca3af"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.88rem",
                color: "#111827",
                outline: "none",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* Role Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={15} color="#6b7280" />
            <select
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.86rem",
                backgroundColor: "#fff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">End User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "0.86rem",
                backgroundColor: "#fff",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
          Showing <strong>{users.length}</strong> of <strong>{total}</strong> users
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>UID</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Name &amp; Username</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Role</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Registration Date</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "#9ca3af" }}>
                    Loading employee accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px", color: "#9ca3af" }}>
                    <User size={32} style={{ margin: "0 auto 8px", color: "#cbd5e1" }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No users found matching query.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = (u.role || "").toLowerCase() === "admin";
                  const isActive = u.is_active !== false;
                  const isSelf = u.uid === currentAdminUid;

                  return (
                    <tr
                      key={u.uid}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fcfdfd")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#64748b", fontWeight: 600 }}>
                        #{u.uid}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: isAdmin
                                ? "linear-gradient(135deg, #7047eb, #818cf8)"
                                : "linear-gradient(135deg, #3b82f6, #60a5fa)",
                              color: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              flexShrink: 0,
                            }}
                          >
                            {(u.full_name || u.username || "U").substring(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827" }}>
                              {u.full_name || u.username}
                              {isSelf && (
                                <span style={{ marginLeft: "6px", fontSize: "0.7rem", color: "#7047eb", background: "#f5f3ff", padding: "1px 6px", borderRadius: "4px" }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#475569" }}>
                        {u.email}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            backgroundColor: isAdmin ? "#f5f3ff" : "#eff6ff",
                            color: isAdmin ? "#7047eb" : "#1d4ed8",
                            border: `1px solid ${isAdmin ? "#ddd6fe" : "#bfdbfe"}`,
                          }}
                        >
                          {isAdmin ? <Shield size={12} /> : <User size={12} />}
                          {u.role_title || (isAdmin ? "Enterprise Admin" : "End User")}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                            backgroundColor: isActive ? "#ecfdf5" : "#fef2f2",
                            color: isActive ? "#15803d" : "#b91c1c",
                            border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {isActive ? "Active" : "Deactivated"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.82rem" }}>
                        {u.c_date || "—"}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {/* Profile Details Button */}
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View Profile Details"
                            style={{
                              background: "none",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: "pointer",
                              color: "#64748b",
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit details */}
                          <button
                            onClick={() => onOpenEditUser(u)}
                            title="Edit User"
                            style={{
                              background: "none",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: "pointer",
                              color: "#7047eb",
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => onToggleStatus(u.uid, !isActive)}
                            disabled={isSelf}
                            title={isActive ? "Deactivate Account" : "Activate Account"}
                            style={{
                              background: "none",
                              border: `1px solid ${isActive ? "#fed7aa" : "#bbf7d0"}`,
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              color: isActive ? "#ea580c" : "#16a34a",
                              opacity: isSelf ? 0.4 : 1,
                            }}
                          >
                            {isActive ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          </button>

                          {/* Delete account */}
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete own account" : "Delete User"}
                            style={{
                              background: "none",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              padding: "5px 7px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              color: "#dc2626",
                              opacity: isSelf ? 0.4 : 1,
                            }}
                          >
                            <Trash2 size={14} />
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

        {/* Pagination Bar */}
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e5e7eb",
            background: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn btn--ghost"
              style={{
                height: "32px",
                padding: "0 10px",
                fontSize: "0.8rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn btn--ghost"
              style={{
                height: "32px",
                padding: "0 10px",
                fontSize: "0.8rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "480px", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7047eb, #818cf8)",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {(selectedUser.full_name || selectedUser.username).substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#111827" }}>
                    {selectedUser.full_name || selectedUser.username}
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "#64748b" }}>UID #{selectedUser.uid} • @{selectedUser.username}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: "12px", margin: "20px 0" }}>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Email:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#111827" }}>{selectedUser.email}</span>
              </div>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Phone:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#111827" }}>{selectedUser.phone || "Not set"}</span>
              </div>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Assigned Role:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: selectedUser.role === "admin" ? "#7047eb" : "#1d4ed8" }}>
                  {selectedUser.role_title || selectedUser.role}
                </span>
              </div>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Account Status:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: selectedUser.is_active !== false ? "#16a34a" : "#dc2626" }}>
                  {selectedUser.is_active !== false ? "Active & Authorized" : "Deactivated"}
                </span>
              </div>
              <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.84rem", color: "#64748b" }}>Registered Date:</span>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#111827" }}>{selectedUser.c_date || "—"}</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setSelectedUser(null)}
                style={{ height: "38px" }}
              >
                Close
              </button>
              <button
                className="btn"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  onOpenEditUser(target);
                }}
                style={{ height: "38px", background: "#7047eb" }}
              >
                Edit User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => setDeleteConfirmUser(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: "440px", padding: "28px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#fee2e2",
                  color: "#dc2626",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>
                Delete User Permanently?
              </h3>
              <p style={{ margin: "8px 0 0", fontSize: "0.86rem", color: "#64748b" }}>
                Are you sure you want to delete user <strong>"{deleteConfirmUser.username}"</strong> (#{deleteConfirmUser.uid})?
                This action will delete all active sessions, security settings, and login logs. This cannot be undone.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setDeleteConfirmUser(null)}
                style={{ flex: 1, height: "40px" }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  const uid = deleteConfirmUser.uid;
                  setDeleteConfirmUser(null);
                  onDeleteUser(uid);
                }}
                style={{
                  flex: 1,
                  height: "40px",
                  background: "#dc2626",
                  color: "#fff",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
