"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminFreelancerItem,
  AdminFreelancerDetail,
  FreelancerStatus,
  adminFreelancersService,
} from "../../services/freelancers";

export default function FreelancersManagementPage() {
  const [freelancers, setFreelancers] = useState<AdminFreelancerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selection & Modals
  const [selectedDetail, setSelectedDetail] = useState<AdminFreelancerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [targetFreelancer, setTargetFreelancer] = useState<AdminFreelancerItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "danger" | "info";
    text: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getFreelancers({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setFreelancers(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Failed to load freelancers list",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page, limit]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  const handleOpenDetail = async (freelancer: AdminFreelancerItem) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const detail = await adminFreelancersService.getFreelancerById(freelancer.id);
      setSelectedDetail(detail);
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Failed to load freelancer profile detail",
      });
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!targetFreelancer) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.approveFreelancer(targetFreelancer.id);
      setNotification({
        type: "success",
        text: `Freelancer "${targetFreelancer.displayName}" has been approved!`,
      });
      setShowApproveModal(false);
      setTargetFreelancer(null);
      loadFreelancers();
      if (selectedDetail && selectedDetail.id === targetFreelancer.id) {
        setShowDetailModal(false);
      }
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Approval failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!targetFreelancer || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.rejectFreelancer(targetFreelancer.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Freelancer "${targetFreelancer.displayName}" was rejected. Feedback recorded.`,
      });
      setShowRejectModal(false);
      setRejectReason("");
      setTargetFreelancer(null);
      loadFreelancers();
      if (selectedDetail && selectedDetail.id === targetFreelancer.id) {
        setShowDetailModal(false);
      }
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Rejection failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!targetFreelancer || !suspendReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.suspendFreelancer(targetFreelancer.id, suspendReason.trim());
      setNotification({
        type: "info",
        text: `Freelancer profile suspended.`,
      });
      setShowSuspendModal(false);
      setSuspendReason("");
      setTargetFreelancer(null);
      loadFreelancers();
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Suspension failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async (freelancer: AdminFreelancerItem) => {
    setActionLoading(true);
    try {
      await adminFreelancersService.reinstateFreelancer(freelancer.id);
      setNotification({
        type: "success",
        text: `Freelancer "${freelancer.displayName}" has been reinstated to approved!`,
      });
      loadFreelancers();
    } catch (err: any) {
      setNotification({
        type: "danger",
        text: err.message || "Reinstate failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getStatusBadge = (status: FreelancerStatus) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Approved</span>;
      case "PENDING":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 animate-pulse">Pending Review</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">Rejected</span>;
      case "SUSPENDED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800">Suspended</span>;
      case "DRAFT":
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Draft</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Freelancers Directory & Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review applicant credentials, verify coverage areas, and approve or reject marketplace professionals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/freelancers/approvals"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-900 bg-amber-100 rounded-lg hover:bg-amber-200 transition"
          >
            <i className="bi bi-clock-history"></i>
            Pending Queue
          </Link>
          <Link
            href="/freelancers/revisions"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
          >
            <i className="bi bi-arrow-repeat"></i>
            Revisions Queue
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : notification.type === "danger"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${notification.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"}`}></i>
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "ALL" ? "All Profiles" : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <i className="bi bi-search absolute left-3 top-2.5 text-gray-400 text-sm"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, title..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Professional</th>
                <th className="px-6 py-4">User & Phone</th>
                <th className="px-6 py-4">Primary Coverage</th>
                <th className="px-6 py-4">Experience & Rate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
                    <p>Loading professionals...</p>
                  </td>
                </tr>
              ) : freelancers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <i className="bi bi-inbox text-3xl text-gray-300 mb-2 block"></i>
                    No freelancers found matching criteria.
                  </td>
                </tr>
              ) : (
                freelancers.map((f) => {
                  const primaryLoc = f.locations?.find((l) => l.isPrimary);
                  const locSummary = primaryLoc
                    ? `${primaryLoc.thana?.name || ""}, ${primaryLoc.district?.name || ""}`
                    : "Not specified";

                  return (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {f.photoUrl ? (
                            <img
                              src={f.photoUrl}
                              alt={f.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                              {f.displayName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{f.displayName}</div>
                            <div className="text-xs text-gray-500">{f.profession?.name || f.title || "Specialist"}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{f.user?.phone || "No phone"}</div>
                        <div className="text-xs text-gray-500">{f.email || f.user?.email || "No email"}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-800 font-medium">{locSummary}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{f.experienceYears} yrs exp</div>
                        <div className="text-xs text-gray-500">
                          {f.startingPrice ? `From ৳${f.startingPrice}` : "Negotiable"}
                        </div>
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(f.status)}</td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetail(f)}
                            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          >
                            Details
                          </button>

                          {f.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => {
                                  setTargetFreelancer(f);
                                  setShowApproveModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setTargetFreelancer(f);
                                  setRejectReason("");
                                  setShowRejectModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {f.status === "APPROVED" && (
                            <button
                              onClick={() => {
                                setTargetFreelancer(f);
                                setSuspendReason("");
                                setShowSuspendModal(true);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                            >
                              Suspend
                            </button>
                          )}

                          {f.status === "SUSPENDED" && (
                            <button
                              onClick={() => handleReinstate(f)}
                              className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                            >
                              Reinstate
                            </button>
                          )}
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {freelancers.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
            {Math.min(page * limit, total)} of {total} professionals
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {detailLoading || !selectedDetail ? (
              <div className="py-20 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500 mt-2">Loading profile details...</p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    {selectedDetail.photoUrl ? (
                      <img
                        src={selectedDetail.photoUrl}
                        alt={selectedDetail.displayName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl">
                        {selectedDetail.displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{selectedDetail.displayName}</h3>
                      <p className="text-sm text-indigo-600 font-medium">
                        {selectedDetail.profession?.name || selectedDetail.title || "Freelancer"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedDetail.status)}
                        <span className="text-xs text-gray-500">{selectedDetail.experienceYears} Years Experience</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-lg"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                {/* Contact & Account info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Phone (Verified)</span>
                    <span className="text-gray-900 font-medium">{selectedDetail.user?.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Email</span>
                    <span className="text-gray-900 font-medium">{selectedDetail.email || selectedDetail.user?.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Street Address</span>
                    <span className="text-gray-900">{selectedDetail.address || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">Registered User ID</span>
                    <span className="font-mono text-xs text-gray-600">{selectedDetail.userId}</span>
                  </div>
                </div>

                {/* About Bio */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">About / Bio</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-gray-100">
                    {selectedDetail.about || "No bio provided."}
                  </p>
                </div>

                {/* Services & Pricing */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Offered Services</h4>
                  <div className="space-y-2">
                    {selectedDetail.services.length === 0 ? (
                      <p className="text-xs text-gray-500">No services listed.</p>
                    ) : (
                      selectedDetail.services.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">{svc.title}</div>
                            {svc.description && (
                              <div className="text-xs text-gray-500">{svc.description}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              {svc.priceType}
                            </span>
                            <div className="text-sm font-bold text-gray-900 mt-0.5">
                              {svc.amount ? `৳${svc.amount}` : "Negotiable"}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coverage Locations */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Coverage Locations ({selectedDetail.locations.length}/5)</h4>
                  <div className="space-y-2">
                    {selectedDetail.locations.map((loc) => (
                      <div key={loc.id} className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">
                            {loc.division.name} &gt; {loc.district.name} &gt; {loc.thana.name}
                          </span>
                          {loc.isPrimary && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600">
                          Post Office: {loc.postOffice.name} ({loc.postOffice.postalCode})
                          {loc.cityCorporation && ` | City Corp: ${loc.cityCorporation.name}`}
                          {loc.ward && ` | Ward #${loc.ward.wardNo}`}
                          {loc.paurashava && ` | Paurashava: ${loc.paurashava.name}`}
                          {loc.union && ` | Union: ${loc.union.name}`}
                          {loc.localityText && ` | Locality: ${loc.localityText}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDetail.skills.map((sk) => (
                      <span
                        key={sk.skillId}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg"
                      >
                        {sk.skill.name} {sk.skill.bnName ? `(${sk.skill.bnName})` : ""}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Portfolio */}
                {selectedDetail.portfolio.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Portfolio Showcase</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedDetail.portfolio.map((item) => (
                        <div key={item.id} className="group relative rounded-lg overflow-hidden border">
                          <img
                            src={item.imageUrl}
                            alt={item.caption || "Portfolio item"}
                            className="w-full h-24 object-cover"
                          />
                          {item.caption && (
                            <div className="p-1 text-[11px] text-gray-600 truncate bg-white">
                              {item.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Close
                  </button>

                  {selectedDetail.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          setTargetFreelancer(selectedDetail);
                          setShowApproveModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                      >
                        Approve Profile
                      </button>
                      <button
                        onClick={() => {
                          setTargetFreelancer(selectedDetail);
                          setRejectReason("");
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                      >
                        Reject Profile
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && targetFreelancer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Approve Freelancer?</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to approve{" "}
              <strong className="text-gray-900 font-semibold">{targetFreelancer.displayName}</strong>?
              This will make their profile publicly visible in the marketplace directory.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                {actionLoading ? "Approving..." : "Yes, Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject with Reason Modal */}
      {showRejectModal && targetFreelancer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Freelancer Application</h3>
            <p className="text-sm text-gray-600">
              Provide a clear, actionable reason for rejecting{" "}
              <strong className="text-gray-900 font-semibold">{targetFreelancer.displayName}</strong>.
              The freelancer will see this feedback in their dashboard to edit and resubmit.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Clear profile photo is required; please add at least 1 verified service description."
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && targetFreelancer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Suspend Freelancer Profile</h3>
            <p className="text-sm text-gray-600">
              Suspending will hide this freelancer from marketplace search and disable client phone reveals.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Reason for Suspension *
              </label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="E.g., Reported for abusive communication or policy breach."
                className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <button
                disabled={actionLoading}
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || !suspendReason.trim()}
                onClick={handleSuspend}
                className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
              >
                {actionLoading ? "Suspending..." : "Confirm Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

