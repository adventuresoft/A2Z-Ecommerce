'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Briefcase,
  MapPin,
  Star,
  ExternalLink,
  Edit3,
  ShieldAlert,
  PhoneCall,
  Eye,
  MessageSquare,
} from 'lucide-react';
import {
  freelancerClient,
  FreelancerProfileData,
  FreelancerAvailability,
} from '../../lib/freelancer-client';

export function FreelancerDashboard() {
  const [profile, setProfile] = useState<FreelancerProfileData | null>(null);
  const [reveals, setReveals] = useState<Array<{ id: string; revealedAt: string; client: { id: string; name: string } }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await freelancerClient.getProfile();
      setProfile(data);
      if (data?.status === 'APPROVED') {
        freelancerClient.getReveals().then(setReveals).catch(() => setReveals([]));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'প্রোফাইল লোড করা সম্ভব হয়নি');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvailabilityChange = async (availability: FreelancerAvailability) => {
    if (!profile) return;
    try {
      setIsUpdatingAvailability(true);
      await freelancerClient.updateAvailability(availability);
      setProfile({ ...profile, availability });
    } catch (err: any) {
      alert(err.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">ড্যাশবোর্ড লোড হচ্ছে... / Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <Briefcase className="w-12 h-12 text-blue-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">
            আপনি এখনো কোনো পেশাদার প্রোফাইল তৈরি করেননি
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            A to Z প্রফেশনাল মার্কেটপ্লেসে যুক্ত হয়ে আপনার এলাকা ও পেশায় ক্লায়েন্টদের সেবা প্রদান শুরু করুন।
          </p>
          <Link
            href="/freelancer/onboarding"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-h-[44px]"
          >
            প্রোফাইল শুরু করুন / Start Onboarding
          </Link>
        </div>
      </div>
    );
  }

  const hasPendingRevision = profile.revisions && profile.revisions.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Banner & Quick Availability */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-slate-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl">
              {profile.displayName.charAt(0)}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">{profile.displayName}</h1>
              {profile.status === 'APPROVED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  অনুমোদিত / Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.title || 'Professional'} • {profile.profession?.name || 'Unclassified'}
            </p>
          </div>
        </div>

        {/* Availability Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 pl-2 pr-1">উপলব্ধতা:</span>
          {(['AVAILABLE', 'BUSY', 'UNAVAILABLE'] as FreelancerAvailability[]).map((status) => {
            const isSelected = profile.availability === status;
            return (
              <button
                key={status}
                type="button"
                disabled={isUpdatingAvailability}
                onClick={() => handleAvailabilityChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer disabled:opacity-50 ${
                  isSelected
                    ? status === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : status === 'BUSY'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {status === 'AVAILABLE'
                  ? 'কাজ নিচ্ছি'
                  : status === 'BUSY'
                    ? 'ব্যস্ত'
                    : 'ছুটিতে'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Warning Banners */}
      {profile.status === 'DRAFT' && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">প্রোফাইলটি খসড়া (DRAFT) অবস্থায় রয়েছে</p>
              <p className="text-xs text-amber-700 mt-0.5">
                গ্রাহকদের সাথে সংযোগ স্থাপন করতে প্রয়োজনীয় সব তথ্য পূরণ করে প্রোফাইলটি জমা দিন।
              </p>
            </div>
          </div>
          <Link
            href="/freelancer/onboarding"
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 shrink-0 cursor-pointer"
          >
            সম্পূর্ণ করুন / Complete
          </Link>
        </div>
      )}

      {profile.status === 'PENDING' && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">প্রোফাইল অনুমোদনের জন্য অপেক্ষমান (Under Review)</p>
            <p className="text-xs text-blue-700 mt-0.5">
              আমাদের টিম আপনার তথ্য যাচাই করছে। যাচাই সম্পন্ন হলে প্রোফাইলটি পাবলিক মার্কেটপ্লেসে দৃশ্যমান হবে।
            </p>
          </div>
        </div>
      )}

      {profile.status === 'REJECTED' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">প্রোফাইল সংশোধন প্রয়োজন (Revision Required)</p>
              <p className="text-xs text-red-700 mt-1 font-medium">
                কারণ: {profile.rejectionReason || 'তথ্য অসম্পূর্ণ'}
              </p>
            </div>
          </div>
          <Link
            href="/freelancer/onboarding"
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shrink-0 cursor-pointer"
          >
            সংশোধন করুন / Edit Profile
          </Link>
        </div>
      )}

      {profile.status === 'SUSPENDED' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">প্রোফাইলটি সাময়িক স্থগিত রয়েছে (Suspended)</p>
            <p className="text-xs text-red-700 mt-0.5">
              কারণ: {profile.suspendReason || 'নীতিমালা লঙ্ঘনের কারণে'}. অনুগ্রহ করে সাপোর্ট টিমের সাথে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      )}

      {/* Pending Revision Alert */}
      {hasPendingRevision && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">একটি প্রোফাইল সংশোধনী পর্যালোচনার জন্য অপেক্ষমান</p>
            <p className="text-xs text-purple-700 mt-0.5">
              আপনার সাম্প্রতিক নাম, ছবি বা বায়ো পরিবর্তনটি অ্যাডমিন রিভিউতে আছে। অনুমোদনের আগ পর্যন্ত আগের লাইভ তথ্যই প্রদর্শিত হবে।
            </p>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">শুরুর রেট (Starts From)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {profile.startingPrice ? `৳ ${profile.startingPrice}` : 'আলোচনা সাপেক্ষে'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">তালিকাভুক্ত সেবা</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {profile.services?.length || 0} টি
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">সেবার এলাকা</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {profile.locations?.length || 0} টি
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">নম্বর আনলক (Phone Unlocks)</span>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {reveals.length} বার
          </p>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/freelancer/onboarding"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Edit3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">প্রোফাইল ও সেবা আপডেট</h3>
          <p className="text-xs text-slate-500 mt-1">
            আপনার বিবরণ, মূল্য তালিকা, এলাকা বা পোর্টফোলিও পরিবর্তন করুন।
          </p>
        </Link>

        <Link
          href="/messages"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">মেসেজ ও বার্তালাপ (Messages)</h3>
          <p className="text-xs text-slate-500 mt-1">
            গ্রাহকদের সাথে সরাসরি ইনবক্সে যোগাযোগ করুন ও প্রস্তাব দিন।
          </p>
        </Link>

        {profile.status === 'APPROVED' ? (
          <Link
            href={`/hire/${profile.id}`}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">পাবলিক প্রোফাইল প্রিভিউ</h3>
            <p className="text-xs text-slate-500 mt-1">
              মার্কেটপ্লেসে আপনার প্রোফাইল ক্লায়েন্টরা যেভাবে দেখছেন।
            </p>
          </Link>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 opacity-60 cursor-not-allowed">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">পাবলিক প্রোফাইল প্রিভিউ</h3>
            <p className="text-xs text-slate-500 mt-1">
              প্রোফাইল অনুমোদিত হওয়ার পর এটি উন্মুক্ত হবে।
            </p>
          </div>
        )}
      </div>

      {/* Reveals History: Who viewed my contact number */}
      {profile.status === 'APPROVED' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">কারা আপনার নম্বর দেখেছেন (Contact Reveals)</h3>
                <p className="text-xs text-slate-500">মেম্বারশিপ থাকা ক্লায়েন্টরা যারা আপনার ফোন নম্বর আনলক করেছেন</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              মোট {reveals.length} জন
            </span>
          </div>

          {reveals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
              এখনো কোনো ক্লায়েন্ট আপনার নম্বর আনলক করেনি। প্রোফাইল ও কাজের বিবরণ সমৃদ্ধ রাখুন যাতে আগ্রহ বৃদ্ধি পায়।
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reveals.map((rev) => (
                <div key={rev.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {(rev.client.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{rev.client.name}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(rev.revealedAt).toLocaleString('bn-BD', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    আনলক সম্পন্ন
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

