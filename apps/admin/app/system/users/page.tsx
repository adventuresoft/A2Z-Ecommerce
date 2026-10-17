"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  AdminUser,
  RoleDefinition,
  PermissionDefinition,
  UserRole,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../../../services/users";

type ActiveTab = "users" | "roles" | "permissions";
type RoleViewMode = "list" | "create" | "edit";

interface ModuleConfig {
  key: string;
  name: string;
  category: string;
  icon: string;
}

const MODULE_REGISTRY: ModuleConfig[] = [
  { key: "user", name: "User", category: "Core Resources", icon: "bi bi-person" },
  { key: "basic_setting", name: "Basic Setting", category: "Basic Settings", icon: "bi bi-gear" },
  { key: "products", name: "Products", category: "Catalog & Store", icon: "bi bi-box-seam" },
  { key: "categories", name: "Categories", category: "Catalog & Store", icon: "bi bi-tags" },
  { key: "brands", name: "Brands", category: "Catalog & Store", icon: "bi bi-award" },
  { key: "attributes", name: "Attributes", category: "Catalog & Store", icon: "bi bi-sliders" },
  { key: "variants", name: "Variants", category: "Catalog & Store", icon: "bi bi-diagram-3" },
  { key: "orders", name: "Orders", category: "Orders & Fulfillment", icon: "bi bi-cart3" },
  { key: "inventory", name: "Inventory", category: "Orders & Fulfillment", icon: "bi bi-boxes" },
  { key: "shipments", name: "Shipments", category: "Orders & Fulfillment", icon: "bi bi-truck" },
  { key: "customers", name: "Customers", category: "Customer & Marketing", icon: "bi bi-people" },
  { key: "marketing", name: "Marketing & Coupons", category: "Customer & Marketing", icon: "bi bi-megaphone" },
  { key: "payments", name: "Payments & Refunds", category: "Finance", icon: "bi bi-credit-card" },
  { key: "engagement", name: "Reviews & Engagement", category: "Engagement", icon: "bi bi-chat-quote" },
  { key: "reports", name: "Reports & Analytics", category: "Reports", icon: "bi bi-graph-up" },
];

export default function AdminUsersManagementPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("users");

  // Feedback notifications
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  /* =========================================================================
     TAB 1: USERS DIRECTORY STATE
     ========================================================================= */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [usersLoading, setUsersLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  // User form data
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "ADMIN" as UserRole,
    roleId: "",
    designation: "",
    location: "",
    isActive: true,
  });
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);

  /* =========================================================================
     TAB 2: ROLE DEFINITIONS & ABILITY MATRIX STATE
     ========================================================================= */
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleViewMode, setRoleViewMode] = useState<RoleViewMode>("list");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Role form & ability matrix
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [matrixCategory, setMatrixCategory] = useState("all");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleDefinition | null>(null);

  /* =========================================================================
     TAB 3: PERMISSION POOL STATE
     ========================================================================= */
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [newPermissionKey, setNewPermissionKey] = useState("");
  const [newPermissionName, setNewPermissionName] = useState("");
  const [newPermissionDesc, setNewPermissionDesc] = useState("");
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [deletingPermission, setDeletingPermission] = useState<PermissionDefinition | null>(null);
  const [editingPermission, setEditingPermission] = useState<PermissionDefinition | null>(null);

  // Debounce user search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setUsersPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  /* =========================================================================
     DATA FETCHING
     ========================================================================= */
  const fetchUsersList = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers({
        page: usersPage,
        limit: usersLimit,
        search: debouncedUserSearch || undefined,
        role: filterRole || undefined,
      });
      setUsers(res.items);
      setUsersTotal(res.total);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load users",
      });
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersLimit, debouncedUserSearch, filterRole]);

  const fetchRolesList = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await getRoles();
      setRoles(res);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load security roles",
      });
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchPermissionsList = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      const res = await getPermissions();
      setPermissions(res);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load permission registry",
      });
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsersList();
    } else if (activeTab === "roles") {
      fetchRolesList();
    } else if (activeTab === "permissions") {
      fetchPermissionsList();
    }
  }, [activeTab, fetchUsersList, fetchRolesList, fetchPermissionsList]);

  // Pre-load roles for user form dropdown
  useEffect(() => {
    if (roles.length === 0) {
      getRoles().then(setRoles).catch(() => {});
    }
  }, [roles.length]);

  /* =========================================================================
     USER ACTIONS
     ========================================================================= */
  const handleOpenAddUser = () => {
    setUserForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "ADMIN",
      roleId: roles.find((r) => r.slug === "admin")?.id || "",
      designation: "",
      location: "Dhaka (District) - District: Dhaka",
      isActive: true,
    });
    setEditingUser(null);
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
      roleId: user.roleId || "",
      designation: user.designation || "",
      location: user.location || "",
      isActive: user.isActive,
    });
    setEditingUser(user);
    setShowAddUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userForm.name,
          phone: userForm.phone || undefined,
          password: userForm.password ? userForm.password : undefined,
          role: userForm.role,
          roleId: userForm.roleId || null,
          designation: userForm.designation?.trim() || null,
          location: userForm.location || null,
          isActive: userForm.isActive,
        });
        setAlert({ type: "success", text: `User ${userForm.name} updated successfully` });
      } else {
        await createUser({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          phone: userForm.phone || undefined,
          role: userForm.role,
          roleId: userForm.roleId || undefined,
          designation: userForm.designation?.trim() || undefined,
          location: userForm.location || undefined,
          isActive: userForm.isActive,
        });
        setAlert({ type: "success", text: `User ${userForm.name} created successfully` });
      }
      setShowAddUserModal(false);
      setEditingUser(null);
      fetchUsersList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to save user",
      });
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser.id);
      setAlert({
        type: "success",
        text: `User ${deletingUser.name} deleted successfully`,
      });
      setDeletingUser(null);
      fetchUsersList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete user",
      });
    }
  };

  /* =========================================================================
     ROLE & ABILITY MATRIX ACTIONS
     ========================================================================= */
  const handleOpenCreateRole = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions(new Set());
    setEditingRoleId(null);
    setMatrixCategory("all");
    setMatrixSearch("");
    setRoleViewMode("create");
  };

  const handleOpenEditRole = (role: RoleDefinition) => {
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedPermissions(new Set(role.permissions));
    setEditingRoleId(role.id);
    setMatrixCategory("all");
    setMatrixSearch("");
    setRoleViewMode("edit");
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permKey)) {
        next.delete(permKey);
      } else {
        next.add(permKey);
      }
      return next;
    });
  };

  const toggleRowPermissions = (moduleKey: string, grant: boolean) => {
    const actions = ["read", "create", "update", "delete"];
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const act of actions) {
        const key = `${moduleKey}.${act}`;
        if (grant) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  };

  const toggleColumnPermissions = (action: string, grant: boolean) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const mod of filteredMatrixModules) {
        const key = `${mod.key}.${action}`;
        if (grant) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  };

  const toggleAllActivePermissions = (grant: boolean) => {
    const actions = ["read", "create", "update", "delete"];
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      for (const mod of filteredMatrixModules) {
        for (const act of actions) {
          const key = `${mod.key}.${act}`;
          if (grant) {
            next.add(key);
          } else {
            next.delete(key);
          }
        }
      }
      return next;
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setAlert({ type: "danger", text: "Role name is required" });
      return;
    }

    setRoleSubmitting(true);
    try {
      const permsArray = Array.from(selectedPermissions);
      if (editingRoleId) {
        await updateRole(editingRoleId, {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          permissions: permsArray,
        });
        setAlert({ type: "success", text: `Role ${roleName} updated successfully` });
      } else {
        await createRole({
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          permissions: permsArray,
        });
        setAlert({ type: "success", text: `Role ${roleName} created successfully` });
      }
      setRoleViewMode("list");
      fetchRolesList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to save role",
      });
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    try {
      await deleteRole(deletingRole.id);
      setAlert({ type: "success", text: `Role ${deletingRole.name} deleted successfully` });
      setDeletingRole(null);
      fetchRolesList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete role",
      });
    }
  };

  /* =========================================================================
     PERMISSION POOL ACTIONS
     ========================================================================= */
  const handleRegisterPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermissionKey.trim()) return;

    setPermissionSubmitting(true);
    try {
      await createPermission({
        key: newPermissionKey.trim().toLowerCase(),
        name: newPermissionName.trim() || undefined,
        description: newPermissionDesc.trim() || undefined,
      });
      setAlert({
        type: "success",
        text: `Permission '${newPermissionKey.trim().toLowerCase()}' registered successfully`,
      });
      setNewPermissionKey("");
      setNewPermissionName("");
      setNewPermissionDesc("");
      fetchPermissionsList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to register permission",
      });
    } finally {
      setPermissionSubmitting(false);
    }
  };

  const handleDeletePermission = async () => {
    if (!deletingPermission) return;
    try {
      await deletePermission(deletingPermission.id);
      setAlert({
        type: "success",
        text: `Permission '${deletingPermission.key}' deleted successfully`,
      });
      setDeletingPermission(null);
      fetchPermissionsList();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete permission",
      });
    }
  };

  /* =========================================================================
     FILTERED MATRIX MODULES
     ========================================================================= */
  const matrixCategories = useMemo(() => {
    const cats = new Set(MODULE_REGISTRY.map((m) => m.category));
    return Array.from(cats);
  }, []);

  const filteredMatrixModules = useMemo(() => {
    return MODULE_REGISTRY.filter((mod) => {
      const matchesCat = matrixCategory === "all" || mod.category === matrixCategory;
      const matchesSearch =
        !matrixSearch.trim() ||
        mod.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        mod.key.toLowerCase().includes(matrixSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [matrixCategory, matrixSearch]);

  const allFilteredReadSelected =
    filteredMatrixModules.length > 0 &&
    filteredMatrixModules.every((m) => selectedPermissions.has(`${m.key}.read`));
  const allFilteredCreateSelected =
    filteredMatrixModules.length > 0 &&
    filteredMatrixModules.every((m) => selectedPermissions.has(`${m.key}.create`));
  const allFilteredUpdateSelected =
    filteredMatrixModules.length > 0 &&
    filteredMatrixModules.every((m) => selectedPermissions.has(`${m.key}.update`));
  const allFilteredDeleteSelected =
    filteredMatrixModules.length > 0 &&
    filteredMatrixModules.every((m) => selectedPermissions.has(`${m.key}.delete`));

  return (
    <div className="container-fluid px-4 py-3">
      {/* =====================================================================
          TOP NAVIGATION TABS (Pixel-matched to Images 1, 2, 3, 4)
          ===================================================================== */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${
              activeTab === "users"
                ? "btn-primary text-white shadow-sm"
                : "btn-outline-secondary border-0 bg-light text-dark"
            }`}
            style={{ borderRadius: "8px" }}
            onClick={() => {
              setActiveTab("users");
              setRoleViewMode("list");
            }}
          >
            <i className="bi bi-people-fill"></i>
            Users Directory
          </button>

          <button
            type="button"
            className={`btn px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${
              activeTab === "roles"
                ? "btn-primary text-white shadow-sm"
                : "btn-outline-secondary border-0 bg-light text-dark"
            }`}
            style={{ borderRadius: "8px" }}
            onClick={() => {
              setActiveTab("roles");
              setRoleViewMode("list");
            }}
          >
            <i className="bi bi-person-badge"></i>
            Role Definitions
          </button>

          <button
            type="button"
            className={`btn px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${
              activeTab === "permissions"
                ? "btn-primary text-white shadow-sm"
                : "btn-outline-secondary border-0 bg-light text-dark"
            }`}
            style={{ borderRadius: "8px" }}
            onClick={() => {
              setActiveTab("permissions");
              setRoleViewMode("list");
            }}
          >
            <i className="bi bi-key-fill"></i>
            Permission Pool
          </button>
        </div>

        {/* Breadcrumb indicator */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 small">
            <li className="breadcrumb-item">
              <Link href="/" className="text-decoration-none text-muted">
                <i className="bi bi-house-door"></i> Home
              </Link>
            </li>
            <li className="breadcrumb-item text-muted">System</li>
            <li className="breadcrumb-item active text-primary fw-semibold" aria-current="page">
              {activeTab === "users"
                ? "Users Directory"
                : activeTab === "roles"
                ? "Role Definitions"
                : "Permission Pool"}
            </li>
          </ol>
        </nav>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 shadow-sm`}
          role="alert"
        >
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill text-success"
                : alert.type === "danger"
                ? "bi-exclamation-triangle-fill text-danger"
                : "bi-info-circle-fill text-info"
            } fs-5`}
          ></i>
          <div>{alert.text}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: USERS DIRECTORY (Image 3)
          ===================================================================== */}
      {activeTab === "users" && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            {/* Header: Title and Add Button */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-people-fill text-dark fs-5"></i>
                <h5 className="mb-0 fw-bold text-dark">Employee Directory</h5>
              </div>
              <button
                type="button"
                className="btn text-white fw-semibold d-flex align-items-center gap-2 shadow-sm"
                style={{ backgroundColor: "#00675b", borderRadius: "6px" }}
                onClick={handleOpenAddUser}
              >
                <i className="bi bi-plus-circle-fill"></i>
                Add New Employee
              </button>
            </div>

            {/* Filter Bar */}
            <div className="row g-3 align-items-center mb-4">
              <div className="col-md-4">
                <label className="form-label small text-muted mb-1">Filter by Role</label>
                <select
                  className="form-select"
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value as UserRole | "");
                    setUsersPage(1);
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SHOP_MANAGER">SHOP_MANAGER</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>

              <div className="col-md-3 d-flex align-items-end pt-3">
                {(filterRole || userSearch) && (
                  <button
                    type="button"
                    className="btn btn-outline-danger d-flex align-items-center gap-1"
                    onClick={() => {
                      setFilterRole("");
                      setUserSearch("");
                      setDebouncedUserSearch("");
                      setUsersPage(1);
                    }}
                  >
                    <i className="bi bi-x-circle"></i>
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Entries per page & Search input */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div className="d-flex align-items-center gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "80px" }}
                  value={usersLimit}
                  onChange={(e) => {
                    setUsersLimit(Number(e.target.value));
                    setUsersPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="small text-muted">entries per page</span>
              </div>

              <div className="position-relative" style={{ width: "260px" }}>
                <input
                  type="text"
                  className="form-control form-control-sm ps-4"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <i
                  className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
                  style={{ left: "10px", fontSize: "0.8rem" }}
                ></i>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 border">
                <thead className="table-light">
                  <tr className="text-secondary small fw-bold">
                    <th style={{ width: "50px" }}>#</th>
                    <th>EMPLOYEE PROFILE</th>
                    <th>CONTACT & AREA</th>
                    <th>DESIGNATION & ROLE</th>
                    <th>STATUS</th>
                    <th style={{ width: "120px" }} className="text-end pe-3">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span className="text-muted">Loading employee directory...</span>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-people display-6 d-block text-secondary mb-2"></i>
                        No employee profiles found matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => {
                      const initial = (user.name || user.email).charAt(0).toUpperCase();
                      return (
                        <tr key={user.id}>
                          {/* Index */}
                          <td className="text-muted small">{(usersPage - 1) * usersLimit + idx + 1}</td>

                          {/* Profile */}
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  backgroundColor: "#e8f0fe",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {initial}
                              </div>
                              <div>
                                <div className="fw-bold text-dark text-uppercase">{user.name}</div>
                                <div className="small text-muted">{user.email}</div>
                                <div className="text-secondary small" style={{ fontSize: "0.75rem" }}>
                                  <i className="bi bi-postcard me-1"></i>
                                  {user.id.slice(0, 11)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact & Area */}
                          <td>
                            <div className="small">
                              <div className="text-dark d-flex align-items-center gap-1 mb-1">
                                <i className="bi bi-telephone text-muted"></i>
                                {user.phone || "N/A"}
                              </div>
                              <div className="text-muted d-flex align-items-center gap-1">
                                <i className="bi bi-geo-alt text-danger"></i>
                                <span className="text-truncate" style={{ maxWidth: "250px" }}>
                                  {user.location || "Dhaka (District) - District: Dhaka"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Designation & Role */}
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div className="small fw-semibold text-dark d-flex align-items-center gap-1">
                                <i className="bi bi-person-badge text-secondary"></i>
                                {user.designation || "Not Assigned"}
                              </div>
                              <div>
                                <span
                                  className={`badge ${
                                    user.role === "SUPER_ADMIN"
                                      ? "bg-warning text-dark"
                                      : user.role === "ADMIN"
                                      ? "bg-success"
                                      : user.role === "SHOP_MANAGER"
                                      ? "bg-info text-dark"
                                      : "bg-secondary"
                                  }`}
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  {user.roleDefinition?.name || user.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {user.isActive ? (
                              <span
                                className="badge d-inline-flex align-items-center gap-1 px-3 py-1"
                                style={{
                                  backgroundColor: "#ecfdf5",
                                  color: "#047857",
                                  border: "1px solid #a7f3d0",
                                  borderRadius: "50px",
                                  fontWeight: 600,
                                }}
                              >
                                <i className="bi bi-check-circle-fill"></i>
                                Verified
                              </span>
                            ) : (
                              <span
                                className="badge d-inline-flex align-items-center gap-1 px-3 py-1 bg-light text-secondary border"
                                style={{ borderRadius: "50px", fontWeight: 600 }}
                              >
                                <i className="bi bi-dash-circle"></i>
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="text-end pe-3">
                            <div className="d-inline-flex gap-1">
                              {/* View detail button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info text-primary border p-1"
                                style={{ width: "32px", height: "32px" }}
                                title="View User Profile"
                                onClick={() => setViewingUser(user)}
                              >
                                <i className="bi bi-eye"></i>
                              </button>

                              {/* Edit button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary border p-1"
                                style={{ width: "32px", height: "32px" }}
                                title="Edit Profile"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger border p-1"
                                style={{ width: "32px", height: "32px" }}
                                title="Delete User"
                                onClick={() => setDeletingUser(user)}
                              >
                                <i className="bi bi-trash"></i>
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

            {/* Pagination */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-4">
              <div className="small text-muted">
                Showing {Math.min((usersPage - 1) * usersLimit + 1, usersTotal)} to{" "}
                {Math.min(usersPage * usersLimit, usersTotal)} of {usersTotal} entries
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={usersPage <= 1}
                  onClick={() => setUsersPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button type="button" className="btn btn-primary active">
                  {usersPage}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={usersPage * usersLimit >= usersTotal}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2.1: REGISTERED ROLE DIRECTORY (Image 4)
          ===================================================================== */}
      {activeTab === "roles" && roleViewMode === "list" && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            {/* Header */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill text-primary fs-4"></i>
                <h4 className="mb-0 fw-bold text-dark">Security Roles Management</h4>
              </div>
              <button
                type="button"
                className="btn btn-primary text-white fw-semibold d-flex align-items-center gap-2 shadow-sm"
                onClick={handleOpenCreateRole}
              >
                <i className="bi bi-plus-circle-fill"></i>
                Create New Role
              </button>
            </div>

            <div className="mb-3 text-muted fw-bold small text-uppercase d-flex align-items-center gap-2">
              <i className="bi bi-card-checklist"></i>
              Registered Role Directory
            </div>

            {/* Role Cards List */}
            {rolesLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                <span className="text-muted">Loading role definitions...</span>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-shield-x display-6 d-block text-secondary mb-2"></i>
                No security roles registered.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="card border rounded-3 p-3 shadow-none bg-white"
                    style={{ transition: "all 0.2s" }}
                  >
                    {/* Top Row: Name, Slug, Description & Action Buttons */}
                    <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="fw-bold mb-0 text-dark">{role.name}</h5>
                          <span className="text-muted small">
                            {role.slug} &mdash; {role.name}
                          </span>
                        </div>
                        <div className="text-muted small fst-italic mt-1">
                          {role.description || "No active capabilities granted."}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {/* Permissions Count Badge */}
                        <span
                          className="badge bg-primary text-white px-3 py-2 fw-semibold"
                          style={{ borderRadius: "50px", fontSize: "0.8rem" }}
                        >
                          {role.permissionCount} Permissions
                        </span>

                        {/* Edit Role Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary p-1"
                          style={{ width: "32px", height: "32px" }}
                          title="Edit Ability Matrix"
                          onClick={() => handleOpenEditRole(role)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        {/* System Reserved label or Delete Button */}
                        {role.isSystem ? (
                          <span
                            className="badge bg-light text-secondary border px-2 py-1 small d-flex align-items-center gap-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <i className="bi bi-lock-fill text-muted"></i>
                            System Reserved
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1"
                            style={{ width: "32px", height: "32px" }}
                            title="Delete Role"
                            onClick={() => setDeletingRole(role)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Visual Ability Matrix Micro-Badges (Matches Image 4) */}
                    <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                      {MODULE_REGISTRY.map((mod) => {
                        const hasRead = role.permissions.includes(`${mod.key}.read`);
                        const hasCreate = role.permissions.includes(`${mod.key}.create`);
                        const hasUpdate = role.permissions.includes(`${mod.key}.update`);
                        const hasDelete = role.permissions.includes(`${mod.key}.delete`);

                        return (
                          <div
                            key={mod.key}
                            className="border rounded p-1 px-2 d-flex align-items-center gap-2 bg-light"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <span className="fw-semibold text-secondary d-flex align-items-center gap-1">
                              <i className="bi bi-folder-fill text-warning"></i>
                              {mod.name}
                            </span>
                            <div className="d-flex gap-1">
                              {/* R */}
                              <span
                                className="fw-bold px-1 rounded"
                                style={{
                                  backgroundColor: hasRead ? "#10b981" : "#e2e8f0",
                                  color: hasRead ? "#ffffff" : "#94a3b8",
                                  fontSize: "0.65rem",
                                }}
                                title="Read"
                              >
                                R
                              </span>
                              {/* C */}
                              <span
                                className="fw-bold px-1 rounded"
                                style={{
                                  backgroundColor: hasCreate ? "#3b82f6" : "#e2e8f0",
                                  color: hasCreate ? "#ffffff" : "#94a3b8",
                                  fontSize: "0.65rem",
                                }}
                                title="Create"
                              >
                                C
                              </span>
                              {/* U */}
                              <span
                                className="fw-bold px-1 rounded"
                                style={{
                                  backgroundColor: hasUpdate ? "#f59e0b" : "#e2e8f0",
                                  color: hasUpdate ? "#ffffff" : "#94a3b8",
                                  fontSize: "0.65rem",
                                }}
                                title="Update"
                              >
                                U
                              </span>
                              {/* D */}
                              <span
                                className="fw-bold px-1 rounded"
                                style={{
                                  backgroundColor: hasDelete ? "#ef4444" : "#e2e8f0",
                                  color: hasDelete ? "#ffffff" : "#94a3b8",
                                  fontSize: "0.65rem",
                                }}
                                title="Delete"
                              >
                                D
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2.2: INITIALIZE / EDIT ROLE (Ability Matrix Editor - Image 1)
          ===================================================================== */}
      {activeTab === "roles" && roleViewMode !== "list" && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            {/* Header: Title and Back Button */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock-fill text-primary fs-4"></i>
                <h4 className="mb-0 fw-bold text-dark">Security Roles Management</h4>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={() => setRoleViewMode("list")}
              >
                <i className="bi bi-arrow-left"></i>
                Back to Role List
              </button>
            </div>

            <form onSubmit={handleSaveRole}>
              {/* Section 1: Role Details */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
                  <i className="bi bi-plus-circle-fill"></i>
                  <span>
                    {roleViewMode === "create" ? "Initialize New Security Role" : "Edit Security Role"}
                  </span>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                      ROLE NAME
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Finance Administrator"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      required
                    />
                    <div className="form-text small text-muted">
                      Unique name for this security profile.
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-uppercase text-secondary mb-1">
                      DESCRIPTION
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Access to financial setups and basic configurations"
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                    />
                    <div className="form-text small text-muted">
                      Brief explanation of this role's responsibilities.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Ability Matrix */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                    <i className="bi bi-shield-shaded"></i>
                    <span>Role Permissions (Ability Matrix)</span>
                  </div>

                  {/* Search inside matrix */}
                  <div className="position-relative" style={{ width: "260px" }}>
                    <input
                      type="text"
                      className="form-control form-control-sm ps-4"
                      placeholder="Search modules or permissions..."
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                    />
                    <i
                      className="bi bi-search position-absolute top-50 translate-middle-y text-muted"
                      style={{ left: "10px", fontSize: "0.8rem" }}
                    ></i>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Left Column: Category Sidebar */}
                  <div className="col-md-3">
                    <div className="list-group shadow-none border rounded">
                      <button
                        type="button"
                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center fw-semibold ${
                          matrixCategory === "all" ? "active" : ""
                        }`}
                        onClick={() => setMatrixCategory("all")}
                      >
                        <span>
                          <i className="bi bi-grid-fill me-2"></i>
                          All Modules
                        </span>
                        <span className="badge rounded-pill bg-light text-dark">
                          {MODULE_REGISTRY.length}
                        </span>
                      </button>

                      {matrixCategories.map((cat) => {
                        const count = MODULE_REGISTRY.filter((m) => m.category === cat).length;
                        return (
                          <button
                            key={cat}
                            type="button"
                            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center small ${
                              matrixCategory === cat ? "active" : ""
                            }`}
                            onClick={() => setMatrixCategory(cat)}
                          >
                            <span>
                              <i className="bi bi-folder2 me-2"></i>
                              {cat}
                            </span>
                            <span className="badge rounded-pill bg-light text-dark">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Active Toggles */}
                    <div className="mt-3 p-2 bg-light rounded border small">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-primary text-decoration-none p-0 d-block mb-1"
                        onClick={() => toggleAllActivePermissions(true)}
                      >
                        <i className="bi bi-check-square me-1"></i>
                        Select All Active
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger text-decoration-none p-0 d-block"
                        onClick={() => toggleAllActivePermissions(false)}
                      >
                        <i className="bi bi-square me-1"></i>
                        Deselect All Active
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Ability Matrix Table */}
                  <div className="col-md-9">
                    <div className="table-responsive border rounded">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr className="small text-secondary fw-bold">
                            <th>MODULE NAME</th>
                            <th className="text-center" style={{ width: "90px" }}>
                              <label className="d-flex align-items-center justify-content-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={allFilteredReadSelected}
                                  onChange={(e) => toggleColumnPermissions("read", e.target.checked)}
                                />
                                <span className="text-success">READ</span>
                              </label>
                            </th>
                            <th className="text-center" style={{ width: "90px" }}>
                              <label className="d-flex align-items-center justify-content-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={allFilteredCreateSelected}
                                  onChange={(e) => toggleColumnPermissions("create", e.target.checked)}
                                />
                                <span className="text-primary">CREATE</span>
                              </label>
                            </th>
                            <th className="text-center" style={{ width: "90px" }}>
                              <label className="d-flex align-items-center justify-content-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={allFilteredUpdateSelected}
                                  onChange={(e) => toggleColumnPermissions("update", e.target.checked)}
                                />
                                <span className="text-warning">UPDATE</span>
                              </label>
                            </th>
                            <th className="text-center" style={{ width: "90px" }}>
                              <label className="d-flex align-items-center justify-content-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="form-check-input mt-0"
                                  checked={allFilteredDeleteSelected}
                                  onChange={(e) => toggleColumnPermissions("delete", e.target.checked)}
                                />
                                <span className="text-danger">DELETE</span>
                              </label>
                            </th>
                            <th className="text-center" style={{ width: "120px" }}>
                              ROW ACTIONS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMatrixModules.map((mod) => {
                            const isRead = selectedPermissions.has(`${mod.key}.read`);
                            const isCreate = selectedPermissions.has(`${mod.key}.create`);
                            const isUpdate = selectedPermissions.has(`${mod.key}.update`);
                            const isDelete = selectedPermissions.has(`${mod.key}.delete`);

                            return (
                              <tr key={mod.key}>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <i className={`${mod.icon} text-primary fs-5`}></i>
                                    <span className="fw-semibold text-dark">{mod.name}</span>
                                  </div>
                                </td>

                                {/* READ */}
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isRead}
                                    onChange={() => togglePermission(`${mod.key}.read`)}
                                  />
                                </td>

                                {/* CREATE */}
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isCreate}
                                    onChange={() => togglePermission(`${mod.key}.create`)}
                                  />
                                </td>

                                {/* UPDATE */}
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isUpdate}
                                    onChange={() => togglePermission(`${mod.key}.update`)}
                                  />
                                </td>

                                {/* DELETE */}
                                <td className="text-center">
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={isDelete}
                                    onChange={() => togglePermission(`${mod.key}.delete`)}
                                  />
                                </td>

                                {/* ROW ACTIONS */}
                                <td className="text-center">
                                  <div className="d-inline-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary p-0 d-flex align-items-center justify-content-center"
                                      style={{ width: "26px", height: "26px" }}
                                      title="Grant all for this row"
                                      onClick={() => toggleRowPermissions(mod.key, true)}
                                    >
                                      <i className="bi bi-check2-all" style={{ fontSize: "0.85rem" }}></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger p-0 d-flex align-items-center justify-content-center"
                                      style={{ width: "26px", height: "26px" }}
                                      title="Clear all for this row"
                                      onClick={() => toggleRowPermissions(mod.key, false)}
                                    >
                                      <i className="bi bi-x-lg" style={{ fontSize: "0.75rem" }}></i>
                                    </button>
                                  </div>
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

              {/* Bottom Action Bar */}
              <div className="d-flex align-items-center gap-2 mt-4 pt-3 border-top">
                <button
                  type="submit"
                  className="btn btn-primary fw-semibold d-flex align-items-center gap-2 shadow-sm"
                  disabled={roleSubmitting}
                >
                  <i className="bi bi-plus-circle-fill"></i>
                  {roleSubmitting
                    ? "Publishing Role..."
                    : roleViewMode === "create"
                    ? "Initialize & Publish Security Role"
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => setSelectedPermissions(new Set())}
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                  Reset Form
                </button>

                <button
                  type="button"
                  className="btn btn-outline-dark ms-auto"
                  onClick={() => setRoleViewMode("list")}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: PERMISSION POOL (Global Permission Registry - Image 2)
          ===================================================================== */}
      {activeTab === "permissions" && (
        <div className="row g-4">
          {/* Left Card: Define New Permission */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold">
                  <i className="bi bi-key-fill"></i>
                  <span>Define New Permission</span>
                </div>

                <form onSubmit={handleRegisterPermission}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary mb-1">
                      Permission Descriptor
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. view-dashboard or users.export"
                      value={newPermissionKey}
                      onChange={(e) => setNewPermissionKey(e.target.value)}
                      required
                    />
                    <div className="form-text small text-muted">
                      Standard dot notation identifier (e.g. module.action).
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary mb-1">Display Name (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Export User Accounts"
                      value={newPermissionName}
                      onChange={(e) => setNewPermissionName(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-secondary mb-1">Description (Optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Brief note about this capability"
                      value={newPermissionDesc}
                      onChange={(e) => setNewPermissionDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="d-flex align-items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary fw-semibold d-flex align-items-center gap-2 shadow-sm"
                      disabled={permissionSubmitting || !newPermissionKey.trim()}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                      {permissionSubmitting ? "Registering..." : "Register Entry"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-1"
                      onClick={() => {
                        setNewPermissionKey("");
                        setNewPermissionName("");
                        setNewPermissionDesc("");
                      }}
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Card: Global Permission Registry */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                    <i className="bi bi-lock-fill"></i>
                    <h5 className="mb-0 fw-bold text-dark">Global Permission Registry</h5>
                  </div>
                  <span className="badge bg-light text-dark border px-3 py-1">
                    {permissions.length} Registered
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 border">
                    <thead className="table-light">
                      <tr className="small text-secondary fw-bold">
                        <th style={{ width: "80px" }}>INDEX</th>
                        <th>KEY IDENTIFIER</th>
                        <th style={{ width: "120px" }} className="text-end pe-3">
                          OPERATIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsLoading ? (
                        <tr>
                          <td colSpan={3} className="text-center py-5">
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            <span className="text-muted">Loading permission registry...</span>
                          </td>
                        </tr>
                      ) : permissions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-5 text-muted">
                            No permissions registered yet.
                          </td>
                        </tr>
                      ) : (
                        permissions.map((perm, idx) => (
                          <tr key={perm.id}>
                            <td className="text-muted small">{idx + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                                  style={{
                                    backgroundColor: "#fce7f3",
                                    color: "#9d174d",
                                    fontFamily: "monospace",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  <i className="bi bi-globe2 text-info"></i>
                                  {perm.key}
                                </span>
                                {perm.name && perm.name !== perm.key && (
                                  <span className="text-muted small">({perm.name})</span>
                                )}
                              </div>
                            </td>
                            <td className="text-end pe-3">
                              <div className="d-inline-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary border p-1"
                                  style={{ width: "32px", height: "32px" }}
                                  title="Edit Permission"
                                  onClick={() => setEditingPermission(perm)}
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                {perm.isSystem ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-light border p-1 text-muted"
                                    style={{ width: "32px", height: "32px" }}
                                    disabled
                                    title="System Reserved Permission"
                                  >
                                    <i className="bi bi-lock"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger border p-1"
                                    style={{ width: "32px", height: "32px" }}
                                    title="Delete Permission"
                                    onClick={() => setDeletingPermission(perm)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT USER
          ===================================================================== */}
      {showAddUserModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  {editingUser ? "Edit Employee Profile" : "Add New Employee"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddUserModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Sharif Mohammad Helal Uddin"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="e.g. hracedhaka@gmail.com"
                        value={userForm.email}
                        disabled={!!editingUser}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">
                        {editingUser ? "New Password (Leave blank to keep current)" : "Password *"}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Minimum 8 characters"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        required={!editingUser}
                        minLength={editingUser ? undefined : 8}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 0172868595"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">System Role *</label>
                      <select
                        className="form-select"
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                        required
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Full Root Access)</option>
                        <option value="ADMIN">ADMIN (Operations Administrator)</option>
                        <option value="SHOP_MANAGER">SHOP_MANAGER (Catalog & Orders)</option>
                        <option value="CUSTOMER">CUSTOMER (Storefront)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Security Role Definition</label>
                      <select
                        className="form-select"
                        value={userForm.roleId}
                        onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                      >
                        <option value="">Default (Direct System Role)</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.permissionCount} permissions)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Designation</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Senior Manager, Sales Lead"
                        value={userForm.designation}
                        onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Location / Area</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Dhaka (District) - District: Dhaka"
                        value={userForm.location}
                        onChange={(e) => setUserForm({ ...userForm, location: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitch"
                          checked={userForm.isActive}
                          onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="activeSwitch">
                          Active Account (Permit login and access)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddUserModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold"
                    disabled={userFormSubmitting}
                  >
                    {userFormSubmitting ? "Saving..." : editingUser ? "Save Changes" : "Create Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: VIEW USER PROFILE
          ===================================================================== */}
      {viewingUser && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Employee Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewingUser(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold text-primary mb-2"
                    style={{ width: "64px", height: "64px", backgroundColor: "#e8f0fe", fontSize: "1.5rem" }}
                  >
                    {(viewingUser.name || viewingUser.email).charAt(0).toUpperCase()}
                  </div>
                  <h5 className="fw-bold mb-0 text-dark">{viewingUser.name}</h5>
                  <div className="text-muted small">{viewingUser.email}</div>
                  <div className="mt-2">
                    <span className="badge bg-primary me-2">{viewingUser.role}</span>
                    {viewingUser.isActive ? (
                      <span className="badge bg-success">Verified / Active</span>
                    ) : (
                      <span className="badge bg-secondary">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="list-group list-group-flush border-top border-bottom small">
                  <div className="list-group-item d-flex justify-content-between py-2">
                    <span className="text-muted">Telephone</span>
                    <span className="fw-semibold text-dark">{viewingUser.phone || "N/A"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between py-2">
                    <span className="text-muted">Designation</span>
                    <span className="fw-semibold text-dark">{viewingUser.designation || "N/A"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between py-2">
                    <span className="text-muted">Location</span>
                    <span className="fw-semibold text-dark">{viewingUser.location || "N/A"}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between py-2">
                    <span className="text-muted">User ID</span>
                    <span className="fw-semibold text-dark font-monospace">{viewingUser.id}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between py-2">
                    <span className="text-muted">Joined</span>
                    <span className="fw-semibold text-dark">
                      {new Date(viewingUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE USER CONFIRMATION
          ===================================================================== */}
      {deletingUser && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Confirm Employee Deletion
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeletingUser(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to permanently delete the following employee?
                </p>
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="fw-bold text-dark">{deletingUser.name}</div>
                  <div className="text-muted small">{deletingUser.email}</div>
                  <div className="small text-danger mt-1">Role: {deletingUser.role}</div>
                </div>
                <p className="small text-muted mb-0">
                  This action cannot be undone. All active sessions and permissions for this user will be immediately revoked.
                </p>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeletingUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE ROLE CONFIRMATION
          ===================================================================== */}
      {deletingRole && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom bg-danger text-white">
                <h5 className="modal-title fw-bold">Confirm Role Deletion</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeletingRole(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">Are you sure you want to delete this security role?</p>
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="fw-bold text-dark">{deletingRole.name}</div>
                  <div className="text-muted small">{deletingRole.slug}</div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeletingRole(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleDeleteRole}
                >
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE PERMISSION CONFIRMATION
          ===================================================================== */}
      {deletingPermission && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0 rounded-3">
              <div className="modal-header border-bottom bg-danger text-white">
                <h5 className="modal-title fw-bold">Confirm Permission Removal</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeletingPermission(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to remove this permission descriptor from the registry?
                </p>
                <div className="p-3 bg-light rounded border mb-3 font-monospace text-danger fw-bold">
                  {deletingPermission.key}
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setDeletingPermission(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleDeletePermission}
                >
                  Delete Permission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
