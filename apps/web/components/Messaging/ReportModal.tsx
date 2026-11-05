'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { messagingClient } from '../../lib/messaging-client';

interface ReportModalProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_REASONS = [
  'Inappropriate or abusive language',
  'Off-platform payment or scam attempt',
  'Harassment or spam messages',
  'Unprofessional conduct or fake credentials',
  'Other violation',
];

export function ReportModal({
  conversationId,
  isOpen,
  onClose,
  onSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === 'Other violation'
        ? customReason.trim()
        : customReason.trim()
          ? `${selectedReason}: ${customReason.trim()}`
          : selectedReason;

    if (!finalReason) {
      setError('Please provide a reason for the report.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await messagingClient.reportConversation(conversationId, finalReason);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Close report dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-red-600">
          <div className="rounded-full bg-red-100 p-2">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id="report-modal-title" className="text-lg font-semibold text-slate-900">
            Report Conversation
          </h2>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Reports are reviewed by platform administrators. All reports are audit-logged and handled confidentially.
        </p>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-800">Reason</label>
            <div className="mt-2 space-y-2">
              {COMMON_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="report-details" className="block text-sm font-medium text-slate-800">
              Additional details (optional)
            </label>
            <textarea
              id="report-details"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe what occurred or paste relevant context..."
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
              maxLength={1000}
            />
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

