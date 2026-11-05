"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminFreelancerItem,
  adminFreelancersService,
} from "../../../services/freelancers";

export default function FreelancerApprovalsQueuePage() {
  const [items, setItems] = useState<AdminFreelancerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [target, setTarget] = useState<AdminFreelancerItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notification, setNotification] = useState<{ type: string; text: string } | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getFreelancers({
        status: "PENDING",
        limit: 50,
      });
      setItems(data.items);
    } catch (err: any) {
      setNotification({ type: "danger", text: err.message || "Failed to load approval queue" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleApprove = async (freelancer: AdminFreelancerItem) => {
    setActionLoading(true);
    try {
      await adminFreelancersService.approveFreelancer(freelancer.id);
      setNotification({
        type: "success",
        text: `Freelancer "${freelancer.displayName}" approved successfully!`,
      });
      loadQueue();
    } catch (err: any) {
      setNotification({ type: "danger", text: err.message || "Approval failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!target || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminFreelancersService.rejectFreelancer(target.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Freelancer "${target.displayName}" rejected with reason.`,
      });
      setShowRejectModal(false);
      setTarget(null);
      setRejectReason("");
      loadQueue();
    } catch (err: any) {
      setNotification({ type: "danger", text: err.message || "Rejection failed" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/freelancers" className="hover:underline">Freelancers</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Pending Approvals Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals Queue</h1>
          <p className="text-sm text-gray-500">
            Review incoming freelancer registrations before they are published to the marketplace.
          </p>
        </div>
        <Link
          href="/freelancers"
          className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          View All Freelancers
        </Link>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-2"></div>
          <p className="text-sm text-gray-500">Fetching pending applications...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="bi bi-check2-all"></i>
          </div>
          <h3 className="text-base font-semibold text-gray-900">All Caught Up!</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            There are no pending freelancer registrations in the review queue right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={item.displayName}
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {item.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{item.displayName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      PENDING
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">
                    {item.profession?.name || item.title || "Specialist"} • {item.experienceYears} yrs experience
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Phone: <span className="font-semibold text-gray-700">{item.user?.phone}</span> • Email: {item.email || item.user?.email || "N/A"}
                  </p>
                  {item.about && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 max-w-xl">
                      {item.about}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  disabled={actionLoading}
                  onClick={() => handleApprove(item)}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  Quick Approve
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => {
                    setTarget(item);
                    setRejectReason("");
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                >
                  Reject...
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && target && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Application</h3>
            <p className="text-sm text-gray-600">
              Provide feedback for <strong className="text-gray-900">{target.displayName}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Specify what needs to be corrected before resubmitting..."
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
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
    </div>
  );
}

