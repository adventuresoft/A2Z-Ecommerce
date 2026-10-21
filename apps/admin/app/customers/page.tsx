"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CustomerItem,
  CustomerStats,
  CustomerSpendingTier,
  customersService,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "../../services/customers";

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<CustomerSpendingTier | "ALL" | "">("");
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "name" | "totalSpent" | "ordersCount" | "lastOrderDate"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Notifications
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateCustomerPayload>({
    name: "",
    email: "",
    password: "",
    phone: "",
    isActive: true,
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
  });

  const [editForm, setEditForm] = useState<UpdateCustomerPayload>({
    name: "",
    phone: "",
    password: "",
    isActive: true,
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await customersService.getCustomerStats();
      setStats(data);
    } catch {
      // Silently fail stats
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersService.getCustomers({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: statusFilter !== "" ? statusFilter : undefined,
        spendingTier: tierFilter || undefined,
        city: cityFilter || undefined,
        sortBy,
        sortOrder,
      });

      setCustomers(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to load customers",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, tierFilter, cityFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("");
    setTierFilter("");
    setCityFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      setAlert({ type: "danger", text: "Name, email, and password are required." });
      return;
    }

    setActionLoading(true);
    try {
      await customersService.createCustomer(createForm);
      setAlert({ type: "success", text: `Customer '${createForm.name}' created successfully.` });
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        isActive: true,
        streetAddress: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bangladesh",
      });
      fetchCustomers();
      loadStats();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to create customer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setEditForm({
      name: c.name,
      phone: c.phone || "",
      password: "",
      isActive: c.isActive,
      city: c.primaryCity || "",
      streetAddress: "",
      postalCode: "",
      country: "Bangladesh",
    });
    setShowEditModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setActionLoading(true);
    try {
      const payload: UpdateCustomerPayload = {
        name: editForm.name,
        phone: editForm.phone || undefined,
        isActive: editForm.isActive,
        city: editForm.city || undefined,
        streetAddress: editForm.streetAddress || undefined,
        postalCode: editForm.postalCode || undefined,
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password;
      }

      await customersService.updateCustomer(selectedCustomer.id, payload);
      setAlert({ type: "success", text: `Customer '${editForm.name}' updated successfully.` });
      setShowEditModal(false);
      fetchCustomers();
      loadStats();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update customer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openStatusModal = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setShowStatusModal(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const nextStatus = !selectedCustomer.isActive;
      const res = await customersService.toggleCustomerStatus(selectedCustomer.id, nextStatus);
      setAlert({ type: "success", text: res.message });
      setShowStatusModal(false);
      fetchCustomers();
      loadStats();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to update customer status.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setShowDeleteModal(true);
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const res = await customersService.deleteCustomer(selectedCustomer.id);
      setAlert({ type: "success", text: res.message });
      setShowDeleteModal(false);
      fetchCustomers();
      loadStats();
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to delete customer.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setAlert({ type: "info", text: "Preparing customer CSV export..." });
      await customersService.exportCustomersCsv({
        search: debouncedSearch || undefined,
        isActive: statusFilter !== "" ? statusFilter : undefined,
        spendingTier: tierFilter || undefined,
        city: cityFilter || undefined,
        sortBy,
        sortOrder,
      });
      setAlert({ type: "success", text: "Customer export downloaded successfully." });
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to export customers.",
      });
    }
  };

  const getTierBadge = (tier: CustomerSpendingTier) => {
    switch (tier) {
      case "VIP":
        return (
          <span className="badge text-white px-2 py-1" style={{ backgroundColor: "#6f42c1" }}>
            <i className="bi bi-star-fill me-1 text-warning"></i>VIP Customer
          </span>
        );
      case "REGULAR":
        return (
          <span className="badge bg-primary text-white px-2 py-1">
            <i className="bi bi-person-check me-1"></i>Regular
          </span>
        );
      case "ONE_TIME":
        return (
          <span className="badge bg-info text-dark px-2 py-1">
            <i className="bi bi-bag me-1"></i>One-Time
          </span>
        );
      case "ZERO_ORDER":
      default:
        return (
          <span className="badge bg-secondary text-white px-2 py-1">
            <i className="bi bi-person-plus me-1"></i>New / Zero Orders
          </span>
        );
    }
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return "CU";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="container-fluid py-3">
      {/* Breadcrumb & Header */}
      <div className="row mb-3 align-items-center">
        <div className="col-sm-6">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link href="/" className="text-decoration-none">
                  Dashboard
                </Link>
              </li>
              <li className="breadcrumb-item">Customers</li>
              <li className="breadcrumb-item active" aria-current="page">
                All Customers
              </li>
            </ol>
          </nav>
          <h1 className="h3 mb-0 text-gray-800 fw-bold">All Customers</h1>
          <p className="text-muted small mb-0">
            View customer accounts, lifetime spending, order frequencies, and account status.
          </p>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => {
              fetchCustomers();
              loadStats();
            }}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? "spin" : ""}`}></i> Refresh
          </button>
          <button
            type="button"
            className="btn btn-outline-success me-2"
            onClick={handleExportCsv}
          >
            <i className="bi bi-download me-1"></i> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-person-plus-fill me-1"></i> Add Customer
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i
            className={`bi me-2 ${
              alert.type === "success"
                ? "bi-check-circle-fill"
                : alert.type === "danger"
                  ? "bi-exclamation-triangle-fill"
                  : "bi-info-circle-fill"
            }`}
          ></i>
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        {/* Total Customers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    Total Customers
                  </div>
                  <div className="h4 mb-0 fw-bold text-gray-800">
                    {statsLoading ? "..." : stats?.totalCustomers || 0}
                  </div>
                  <div className="text-muted small mt-1">
                    <span className="text-success fw-bold">{stats?.activeCustomers || 0} active</span>{" "}
                    · {stats?.inactiveCustomers || 0} inactive
                  </div>
                </div>
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 text-primary">
                  <i className="bi bi-people-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">
                    Active Accounts
                  </div>
                  <div className="h4 mb-0 fw-bold text-gray-800">
                    {statsLoading ? "..." : stats?.activeCustomers || 0}
                  </div>
                  <div className="text-muted small mt-1">
                    {stats?.totalCustomers
                      ? `${Math.round(((stats.activeCustomers || 0) / stats.totalCustomers) * 100)}% retention rate`
                      : "0% active"}
                  </div>
                </div>
                <div className="rounded-circle bg-success bg-opacity-10 p-3 text-success">
                  <i className="bi bi-person-check-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP & High-Value Segment */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div
            className="card shadow-sm border-0 border-start border-4 h-100"
            style={{ borderColor: "#6f42c1" }}
          >
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div
                    className="text-xs fw-bold text-uppercase mb-1"
                    style={{ color: "#6f42c1" }}
                  >
                    VIP Customers
                  </div>
                  <div className="h4 mb-0 fw-bold text-gray-800">
                    {statsLoading ? "..." : stats?.vipCustomers || 0}
                  </div>
                  <div className="text-muted small mt-1">
                    <span className="fw-semibold text-primary">{stats?.repeatCustomers || 0} repeat buyers</span>
                  </div>
                </div>
                <div
                  className="rounded-circle p-3"
                  style={{ backgroundColor: "rgba(111, 66, 193, 0.1)", color: "#6f42c1" }}
                >
                  <i className="bi bi-award-fill fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue & AOV */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                    Total Customer Spend
                  </div>
                  <div className="h4 mb-0 fw-bold text-gray-800">
                    ৳{statsLoading ? "..." : (stats?.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-muted small mt-1">
                    Avg Order: <span className="fw-bold">৳{stats?.averageOrderValue || 0}</span>
                  </div>
                </div>
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 text-warning">
                  <i className="bi bi-cash-stack fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by customer name, email, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Account Statuses</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive / Suspended</option>
              </select>
            </div>

            {/* Spending Tier Filter */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="">All Spending Tiers</option>
                <option value="VIP">VIP Customers</option>
                <option value="REGULAR">Regular Customers</option>
                <option value="ONE_TIME">One-Time Customers</option>
                <option value="ZERO_ORDER">Zero-Order Customers</option>
              </select>
            </div>

            {/* Sort Field */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setPage(1);
                }}
              >
                <option value="createdAt">Sort: Joined Date</option>
                <option value="totalSpent">Sort: Total Spent</option>
                <option value="ordersCount">Sort: Total Orders</option>
                <option value="lastOrderDate">Sort: Last Active</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>

            {/* Sort Order & Reset */}
            <div className="col-6 col-md-2 d-flex gap-1">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary flex-grow-1"
                title={`Ordering: ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <i className={`bi bi-sort-${sortOrder === "asc" ? "up" : "down"} me-1`}></i>
                {sortOrder.toUpperCase()}
              </button>
              {(searchTerm || statusFilter || tierFilter || cityFilter) && (
                <button
                  type="button"
                  className="btn btn-sm btn-light border text-danger"
                  title="Clear all filters"
                  onClick={handleResetFilters}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Customers Data Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <h6 className="m-0 fw-bold text-gray-800">
            <i className="bi bi-people me-2 text-primary"></i>
            Customers Directory{" "}
            <span className="badge bg-secondary ms-1 fw-normal">{total} records</span>
          </h6>
          <div className="text-muted small">
            Showing page {page} of {totalPages || 1}
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small text-uppercase">
                <tr>
                  <th scope="col" className="ps-3" style={{ minWidth: "220px" }}>
                    Customer Details
                  </th>
                  <th scope="col" style={{ minWidth: "140px" }}>
                    Tier / Segment
                  </th>
                  <th scope="col" style={{ minWidth: "120px" }}>
                    Destination
                  </th>
                  <th scope="col" className="text-end" style={{ minWidth: "130px" }}>
                    Orders & Spend
                  </th>
                  <th scope="col" style={{ minWidth: "110px" }}>
                    Last Active
                  </th>
                  <th scope="col" className="text-center" style={{ minWidth: "100px" }}>
                    Status
                  </th>
                  <th scope="col" className="text-end pe-3" style={{ minWidth: "150px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading customer records...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <i className="bi bi-people text-muted fs-1 d-block mb-2"></i>
                      <div className="fw-semibold text-gray-700">No customers found</div>
                      <p className="text-muted small mb-3">
                        Try adjusting your search criteria or register a new customer account.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <i className="bi bi-person-plus-fill me-1"></i> Add First Customer
                      </button>
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id}>
                      {/* Customer Info */}
                      <td className="ps-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2 shadow-sm"
                            style={{
                              width: "38px",
                              height: "38px",
                              backgroundColor:
                                c.spendingTier === "VIP"
                                  ? "#6f42c1"
                                  : c.isActive
                                    ? "#0d6efd"
                                    : "#6c757d",
                              fontSize: "13px",
                            }}
                          >
                            {getAvatarInitials(c.name)}
                          </div>
                          <div>
                            <Link
                              href={`/customers/${c.id}`}
                              className="fw-bold text-decoration-none text-gray-800 d-block text-truncate"
                              style={{ maxWidth: "200px" }}
                              title={c.name}
                            >
                              {c.name}
                            </Link>
                            <div className="text-muted small text-truncate" style={{ maxWidth: "200px" }}>
                              <i className="bi bi-envelope me-1"></i>
                              {c.email}
                            </div>
                            {c.phone && (
                              <div className="text-muted small">
                                <i className="bi bi-telephone me-1"></i>
                                {c.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td>{getTierBadge(c.spendingTier)}</td>

                      {/* Location */}
                      <td>
                        {c.primaryCity ? (
                          <span className="small text-gray-700">
                            <i className="bi bi-geo-alt text-danger me-1"></i>
                            {c.primaryCity}
                          </span>
                        ) : (
                          <span className="text-muted small">Not specified</span>
                        )}
                      </td>

                      {/* Orders & Spend */}
                      <td className="text-end">
                        <div className="fw-bold text-gray-800">
                          ৳{c.totalSpent.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-muted small">
                          {c.ordersCount} {c.ordersCount === 1 ? "order" : "orders"}
                          {c.ordersCount > 0 && ` (Avg: ৳${Math.round(c.averageOrderValue)})`}
                        </div>
                      </td>

                      {/* Last Active */}
                      <td>
                        {c.lastOrderDate ? (
                          <div>
                            <div className="small fw-semibold text-gray-800">
                              {new Date(c.lastOrderDate).toLocaleDateString()}
                            </div>
                            <div className="text-muted text-xs">
                              Joined {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="badge bg-light text-muted border">No orders</span>
                            <div className="text-muted text-xs mt-1">
                              Joined {new Date(c.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        {c.isActive ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                            <i className="bi bi-check-circle me-1"></i>Active
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                            <i className="bi bi-dash-circle me-1"></i>Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            href={`/customers/${c.id}`}
                            className="btn btn-outline-primary"
                            title="View Customer 360 Details"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            title="Edit Customer"
                            onClick={() => openEditModal(c)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn ${c.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                            title={c.isActive ? "Suspend Customer" : "Activate Customer"}
                            onClick={() => openStatusModal(c)}
                          >
                            <i className={`bi ${c.isActive ? "bi-slash-circle" : "bi-check2-circle"}`}></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            title="Delete Customer"
                            onClick={() => openDeleteModal(c)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex align-items-center justify-content-between py-3 border-top">
            <div className="text-muted small">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} customers
            </div>
            <nav aria-label="Customer list pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}
                      <li className={`page-item ${p === page ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setPage(p)}>
                          {p}
                        </button>
                      </li>
                    </React.Fragment>
                  ))}
                <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-person-plus-fill me-2"></i> Register New Customer
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <form onSubmit={handleCreateCustomer}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Tanvir Hossain"
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        placeholder="e.g. tanvir@example.com"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Initial Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Contact Telephone</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. +8801711223344"
                        value={createForm.phone || ""}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <hr className="my-2" />
                      <h6 className="fw-bold fs-7 text-muted text-uppercase mb-2">
                        Delivery Address (Optional)
                      </h6>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-semibold">Street Address</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="House / Road / Area"
                        value={createForm.streetAddress || ""}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, streetAddress: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">City</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Dhaka"
                        value={createForm.city || ""}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">State / Division</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Dhaka Division"
                        value={createForm.state || ""}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Postal Code</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 1212"
                        value={createForm.postalCode || ""}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, postalCode: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12 mt-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="createIsActive"
                          checked={createForm.isActive}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, isActive: e.target.checked })
                          }
                        />
                        <label className="form-check-label small" htmlFor="createIsActive">
                          Activate customer account immediately upon creation
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2 me-1"></i> Register Customer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showEditModal && selectedCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Customer Profile
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <form onSubmit={handleUpdateCustomer}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email (Read Only)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light"
                      value={selectedCustomer.email}
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Primary City</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editForm.city || ""}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Reset Password (Leave blank to keep existing)
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Enter new password if resetting"
                      minLength={6}
                      value={editForm.password || ""}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="editIsActive"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    />
                    <label className="form-check-label small" htmlFor="editIsActive">
                      Account is active and permitted to login
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-dark" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-1"></i> Update Customer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {showStatusModal && selectedCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow">
              <div
                className={`modal-header ${
                  selectedCustomer.isActive ? "bg-warning text-dark" : "bg-success text-white"
                }`}
              >
                <h5 className="modal-title fs-6 fw-bold">
                  <i
                    className={`bi ${selectedCustomer.isActive ? "bi-slash-circle" : "bi-check-circle"} me-2`}
                  ></i>
                  {selectedCustomer.isActive ? "Suspend Account" : "Activate Account"}
                </h5>
                <button
                  type="button"
                  className={`btn-close ${selectedCustomer.isActive ? "" : "btn-close-white"}`}
                  onClick={() => setShowStatusModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-3">
                <p className="small mb-0">
                  Are you sure you want to {selectedCustomer.isActive ? "suspend" : "activate"}{" "}
                  <strong>{selectedCustomer.name}</strong>?
                </p>
                {selectedCustomer.isActive && (
                  <p className="text-muted small mt-2 mb-0">
                    Suspending this account will immediately revoke all active customer sessions and
                    prevent checkout.
                  </p>
                )}
              </div>
              <div className="modal-footer bg-light p-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowStatusModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${selectedCustomer.isActive ? "btn-warning" : "btn-success"}`}
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : selectedCustomer.isActive ? "Suspend Account" : "Activate Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedCustomer && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Delete Customer Account
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to delete customer <strong>{selectedCustomer.name}</strong> (
                  {selectedCustomer.email})?
                </p>
                <div className="alert alert-warning small mb-0">
                  <i className="bi bi-shield-exclamation me-1"></i>
                  If this customer has historical orders, their account will be deactivated and
                  sessions revoked to safeguard financial auditing records.
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteCustomer}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
