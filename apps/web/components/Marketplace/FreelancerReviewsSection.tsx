'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Flag,
  MessageSquare,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  marketplaceClient,
  type FreelancerReviewItem,
  type FreelancerReviewsResponse,
} from '../../lib/marketplace-client';
import { initials } from '../../lib/marketplace-format';

function StarRating({
  value,
  size = 18,
  interactive = false,
  onChange,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
}) {
  const [hoverVal, setHoverVal] = useState<number | null>(null);
  const activeVal = hoverVal ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? 'radiogroup' : undefined}
      aria-label={`Rating: ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= activeVal;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHoverVal(star)}
            onMouseLeave={() => interactive && setHoverVal(null)}
            className={`${
              interactive
                ? 'cursor-pointer transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-primary'
                : 'cursor-default pointer-events-none'
            }`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={`shrink-0 transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              }`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

export function FreelancerReviewsSection({
  freelancerId,
  freelancerName,
  onReviewsUpdated,
}: {
  freelancerId: string;
  freelancerName: string;
  onReviewsUpdated?: () => void;
}) {
  const { isAuthenticated } = useAuth();

  const [data, setData] = useState<FreelancerReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Client personal review state
  const [myReview, setMyReview] = useState<FreelancerReviewItem | null>(null);
  const [checkingMyReview, setCheckingMyReview] = useState(false);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Report modal state
  const [reportingReview, setReportingReview] = useState<FreelancerReviewItem | null>(null);
  const [reportReason, setReportReason] = useState('OFFENSIVE');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Load reviews list
  const loadReviews = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      try {
        const res = await marketplaceClient.getReviews(freelancerId, targetPage, 5);
        setData(res);
        setPage(res.page);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoading(false);
      }
    },
    [freelancerId],
  );

  // Load user's review if authenticated
  const loadMyReview = useCallback(async () => {
    if (!isAuthenticated) {
      setMyReview(null);
      return;
    }
    setCheckingMyReview(true);
    try {
      const res = await marketplaceClient.getMyReview(freelancerId);
      setMyReview(res);
      if (res) {
        setFormRating(res.rating);
        setFormComment(res.comment);
        setFormImages(res.images || []);
      }
    } catch {
      // 401 or not reviewed yet
      setMyReview(null);
    } finally {
      setCheckingMyReview(false);
    }
  }, [freelancerId, isAuthenticated]);

  useEffect(() => {
    void loadReviews(1);
    void loadMyReview();
  }, [loadReviews, loadMyReview]);

  // Handle Add Image URL to draft
  const handleAddImage = () => {
    const trimmed = formImageUrl.trim();
    if (!trimmed) return;
    if (formImages.length >= 3) {
      setFormError('You can attach up to 3 photos.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      setFormError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }
    setFormImages([...formImages, trimmed]);
    setFormImageUrl('');
    setFormError(null);
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  // Submit Review (Create or Update)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const commentTrimmed = formComment.trim();
    if (commentTrimmed.length < 10) {
      setFormError('Review comment must be at least 10 characters.');
      return;
    }
    if (commentTrimmed.length > 500) {
      setFormError('Review comment cannot exceed 500 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (myReview) {
        // Edit existing review
        if (myReview.editCount >= 1) {
          setFormError('You have already edited your review once. Further edits are not allowed.');
          setSubmitting(false);
          return;
        }
        const updated = await marketplaceClient.updateReview(freelancerId, {
          rating: formRating,
          comment: commentTrimmed,
          images: formImages,
        });
        setMyReview(updated);
        setFormSuccess('Review updated successfully!');
      } else {
        // Create new review
        const created = await marketplaceClient.createReview(freelancerId, {
          rating: formRating,
          comment: commentTrimmed,
          images: formImages,
        });
        setMyReview(created);
        setFormSuccess('Review submitted successfully! Thank you for your feedback.');
      }

      setIsFormOpen(false);
      void loadReviews(1);
      onReviewsUpdated?.();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Failed to submit review.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    setReportSubmitting(true);
    setReportError(null);
    try {
      await marketplaceClient.reportReview(
        reportingReview.id,
        reportReason,
        reportDetails.trim() || undefined,
      );
      setReportSuccess(true);
      setTimeout(() => {
        setReportingReview(null);
        setReportSuccess(false);
        setReportDetails('');
      }, 2000);
    } catch (err: any) {
      setReportError(err?.data?.message || err?.message || 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const summary = data?.summary;
  const totalReviews = summary?.totalReviews ?? 0;
  const averageRating = summary?.averageRating;
  const distribution = summary?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const canEdit = myReview && myReview.editCount < 1;
  const editExhausted = myReview && myReview.editCount >= 1;

  return (
    <section
      aria-labelledby="reviews-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 id="reviews-heading" className="text-lg font-bold text-slate-900">
            Ratings & Reviews
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real feedback from verified clients who contacted or worked with {freelancerName}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary transition"
            >
              Sign in to write a review
            </Link>
          ) : myReview ? (
            canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(!isFormOpen);
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-primary transition"
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                {isFormOpen ? 'Cancel edit' : 'Edit my review'}
              </button>
            ) : null
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-primary transition"
            >
              {isFormOpen ? 'Cancel' : 'Write a review'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Score & Distribution Breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-[140px_1fr] sm:items-center">
        {/* Score Box */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50/60 p-4 ring-1 ring-amber-500/10 text-center">
          <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {averageRating ? averageRating.toFixed(1) : '—'}
          </span>
          <div className="mt-1">
            <StarRating value={averageRating ? Math.round(averageRating) : 0} size={16} />
          </div>
          <span className="mt-1.5 text-xs font-medium text-slate-600">
            {totalReviews > 0
              ? `${totalReviews} review${totalReviews > 1 ? 's' : ''}`
              : 'No reviews yet'}
          </span>
        </div>

        {/* Rating Bars */}
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars] ?? 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 font-semibold text-slate-700 tabular-nums text-right">
                  {stars}★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 font-mono text-slate-400 text-right tabular-nums">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-emerald-50 p-3.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Review Form (Write or Edit) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 transition"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {myReview ? 'Edit Your Review' : `Rate your experience with ${freelancerName}`}
            </h3>
            {myReview && (
              <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                Note: You can edit your review at most once
              </span>
            )}
          </div>

          {formError && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-inset ring-rose-600/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {/* Star selector */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your overall rating
            </label>
            <StarRating
              value={formRating}
              size={24}
              interactive={true}
              onChange={setFormRating}
            />
          </div>

          {/* Comment */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label htmlFor="review-comment" className="text-xs font-semibold text-slate-700">
                Detailed review
              </label>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {formComment.length}/500 (min 10)
              </span>
            </div>
            <textarea
              id="review-comment"
              rows={4}
              required
              minLength={10}
              maxLength={500}
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder="How was the communication, work quality, punctuality, and pricing? Share details to help other clients."
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          {/* Optional Image URLs */}
          <div className="mt-4">
            <label htmlFor="review-image-input" className="block text-xs font-semibold text-slate-700">
              Attach photos (optional, up to 3)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="review-image-input"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                disabled={formImages.length >= 3}
                className="block min-h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-primary disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={formImages.length >= 3 || !formImageUrl.trim()}
                className="min-h-10 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
              >
                Add image
              </button>
            </div>

            {formImages.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {formImages.map((url, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-md border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Review photo ${idx + 1}`}
                      className="h-16 w-16 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-rose-600 transition"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-200 pt-3.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="min-h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60 transition"
            >
              {submitting ? 'Submitting...' : myReview ? 'Update review' : 'Submit review'}
            </button>
          </div>
        </form>
      )}

      {/* Existing User Review Highlight (if not editing) */}
      {myReview && !isFormOpen && (
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary-soft/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Your Review
            </span>
            <div className="flex items-center gap-2">
              {editExhausted && (
                <span className="text-[11px] font-medium text-slate-500">
                  (Edited - max limit reached)
                </span>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Edit3 className="h-3 w-3" aria-hidden="true" />
                  Edit review
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={myReview.rating} size={14} />
            <span className="text-xs text-slate-500">
              {new Date(myReview.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
            {myReview.comment}
          </p>
          {myReview.images && myReview.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {myReview.images.map((img, i) => (
                <a
                  key={i}
                  href={img}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Review attachment" className="h-14 w-14 object-cover" />
                </a>
              ))}
            </div>
          )}
          {myReview.freelancerReply && (
            <div className="mt-3 rounded-lg bg-white p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-900">
                Response from {freelancerName}
              </p>
              <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">
                {myReview.freelancerReply}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-6 divide-y divide-slate-100">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading reviews...</div>
        ) : (data?.reviews.length ?? 0) === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No reviews yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Be the first verified client to review {freelancerName}!
            </p>
          </div>
        ) : (
          data?.reviews.map((rev) => {
            const isMyCurrent = myReview?.id === rev.id;
            return (
              <article key={rev.id} className="py-4 first:pt-2">
                <div className="flex items-start justify-between gap-3">
                  {/* Client info */}
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      {initials(rev.client?.name || 'Client')}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900">
                          {rev.client?.name || 'Client'}
                        </span>
                        {isMyCurrent && (
                          <span className="rounded bg-primary-soft px-1.5 py-0.2 text-[10px] font-semibold text-primary">
                            You
                          </span>
                        )}
                        {rev.isVerifiedContact && (
                          <span
                            title="Verified contact: Client revealed contact or chatted with this professional"
                            className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                          >
                            <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                            Verified Client
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating value={rev.rating} size={12} />
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {rev.editCount > 0 && (
                          <span className="text-[10px] text-slate-400 italic">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Report */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setReportingReview(rev)}
                      title="Report this review"
                      className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      aria-label="Report review"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="mt-2.5 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                {/* Review Photos */}
                {rev.images && rev.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rev.images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="overflow-hidden rounded-md border border-slate-200 transition hover:opacity-90"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt="Review attachment"
                          loading="lazy"
                          className="h-16 w-16 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Freelancer Reply */}
                {rev.freelancerReply && (
                  <div className="mt-3 rounded-lg border-l-2 border-primary bg-slate-50 p-3 pl-3.5">
                    <div className="flex items-baseline justify-between">
                      <p className="text-xs font-semibold text-slate-900">
                        Response from {freelancerName}
                      </p>
                      {rev.repliedAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.repliedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {rev.freelancerReply}
                    </p>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
          <span className="text-slate-500">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => loadReviews(page - 1)}
              className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => loadReviews(page + 1)}
              className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingReview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-600" />
                Report Review
              </h3>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">Report submitted</p>
                <p className="mt-1 text-xs text-slate-500">
                  Thank you. Our moderation team will investigate this review.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="mt-4 space-y-3.5">
                {reportError && (
                  <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded">{reportError}</p>
                )}

                <div>
                  <label htmlFor="report-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for report
                  </label>
                  <select
                    id="report-reason"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <option value="OFFENSIVE">Offensive or abusive language</option>
                    <option value="SPAM">Spam or advertising</option>
                    <option value="FALSE_INFORMATION">False or misleading information</option>
                    <option value="OTHER">Other violation</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="report-details" className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional details (optional)
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    maxLength={300}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide additional context to help our moderators..."
                    className="block w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingReview(null)}
                    className="min-h-9 rounded-lg border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="min-h-9 rounded-lg bg-rose-600 px-3.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

