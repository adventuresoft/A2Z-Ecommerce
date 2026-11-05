"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AdminRevisionItem,
  adminFreelancersService,
} from "../../../services/freelancers";

export default function FreelancerRevisionsQueuePage() {
  const [items, setItems] = useState<AdminRevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [target, setTarget] = useState<AdminRevisionItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notification, setNotification] = useState<{ type: string; text: string } | null>(null);

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFreelancersService.getRevisions({
        status: "PENDING",
        limit: 50,
      });
      setItems(data.items);
    } catch (err: any) {
      setNotification({ type: "danger", text: err.message || "Failed to load revisions" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevisions();
  }, [loadRevisions]);

  const handleApprove = async (revision: AdminRevisionItem) => {
    setActionLoading(true);
    try {
      await adminFreelancersService.approveRevision(revision.id);
      setNotification({
        type: "success",
        text: `Profile revision approved and applied live!`,
      });
      loadRevisions();
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
      await adminFreelancersService.rejectRevision(target.id, rejectReason.trim());
      setNotification({
        type: "info",
        text: `Revision rejected. Freelancer informed.`,
      });
      setShowRejectModal(false);
      setTarget(null);
      setRejectReason("");
      loadRevisions();
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
            <span className="text-gray-900 font-medium">Revisions Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sensitive Field Revisions Queue</h1>
          <p className="text-sm text-gray-500">
            Approved freelancers who updated sensitive fields (name, photo, bio, portfolio) require admin diff approval before changes become public.
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
          <p className="text-sm text-gray-500">Fetching pending revisions...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
            <i className="bi bi-shield-check"></i>
          </div>
          <h3 className="text-base font-semibold text-gray-900">No Pending Revisions</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            All submitted profile revisions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">
                      {rev.freelancer?.displayName || "Freelancer"}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                      REVISION PENDING
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {new Date(rev.createdAt).toLocaleString()} • User Phone: {rev.freelancer?.user?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(rev)}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    Approve Diff
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => {
                      setTarget(rev);
                      setRejectReason("");
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
                  >
                    Reject Diff...
                  </button>
                </div>
              </div>

              {/* Proposed Changes Diff View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Live Current */}
                <div className="p-4 bg-gray-50 rounded-lg border text-xs space-y-2">
                  <div className="font-bold text-gray-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <i className="bi bi-clock-history"></i> Current Live Profile
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Name</span>
                    <span className="font-semibold text-gray-800">{rev.freelancer?.displayName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Live Photo</span>
                    {rev.freelancer?.photoUrl ? (
                      <img
                        src={rev.freelancer.photoUrl}
                        alt="Current"
                        className="w-14 h-14 rounded-lg object-cover border mt-1"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No photo set</span>
                    )}
                  </div>
                </div>

                {/* Proposed Changes */}
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 text-xs space-y-2">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <i className="bi bi-arrow-repeat"></i> Proposed Changes
                  </div>
                  {rev.payload.displayName && (
                    <div>
                      <span className="text-blue-500 block text-[10px] uppercase">Proposed Name</span>
                      <span className="font-bold text-blue-950 bg-blue-100 px-1.5 py-0.5 rounded">
                        {rev.payload.displayName}
                      </span>
                    </div>
                  )}
                  {rev.payload.photoUrl && (
                    <div>
                      <span className="text-blue-500 block text-[10px] uppercase">Proposed Photo</span>
                      <img
                        src={rev.payload.photoUrl}
                        alt="Proposed"
                        className="w-14 h-14 rounded-lg object-cover border border-blue-300 mt-1"
                      />
                    </div>
                  )}
                  {rev.payload.about && (
                    <div>
                      <span className="text-blue-500 block text-[10px] uppercase">Proposed Bio</span>
                      <p className="text-gray-800 bg-white p-2 rounded border border-blue-100 mt-1 whitespace-pre-line">
                        {rev.payload.about}
                      </p>
                    </div>
                  )}
                  {rev.payload.portfolio && (
                    <div>
                      <span className="text-blue-500 block text-[10px] uppercase">
                        Proposed Portfolio ({rev.payload.portfolio.length} items)
                      </span>
                      <div className="flex gap-2 mt-1">
                        {rev.payload.portfolio.map((item, idx) => (
                          <img
                            key={idx}
                            src={item.imageUrl}
                            alt="Proposed portfolio"
                            className="w-12 h-12 rounded object-cover border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && target && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Reject Revision</h3>
            <p className="text-sm text-gray-600">
              Provide feedback why this revision cannot be approved.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Photo resolution is blurry; please submit a clear portrait."
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

