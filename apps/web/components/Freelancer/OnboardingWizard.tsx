'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Briefcase,
  MapPin,
  Wrench,
  Image as ImageIcon,
  Send,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Star,
  ShieldCheck,
} from 'lucide-react';
import {
  freelancerClient,
  FreelancerProfileData,
  FreelancerLocationData,
  FreelancerServiceData,
  ServicePriceType,
} from '../../lib/freelancer-client.js';
import { CascadingLocationSelector } from '../UI/CascadingLocationSelector.js';

interface StepProps {
  profile: FreelancerProfileData | null;
  onRefresh: () => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<FreelancerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await freelancerClient.getProfile();
      setProfile(data);
    } catch (err: any) {
      if (err.status === 404) {
        // No profile yet, will create via Step 1 OTP
        setProfile(null);
      } else {
        setErrorMsg(err.message || 'Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const steps = [
    { number: 1, label: 'পরিচিতি', labelEn: 'Identity', icon: Briefcase },
    { number: 2, label: 'পেশা ও দক্ষতা', labelEn: 'Profession', icon: Wrench },
    { number: 3, label: 'সেবা ও ফি', labelEn: 'Services', icon: Star },
    { number: 4, label: 'এলাকা', labelEn: 'Locations', icon: MapPin },
    { number: 5, label: 'পোর্টফোলিও ও জমা', labelEn: 'Submit', icon: Send },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium text-sm">প্রোফাইল লোড হচ্ছে... / Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          পেশাদার নিবন্ধন ও প্রোফাইল সেটআপ
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Professional Onboarding & Verification Wizard • A to Z Marketplace
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Stepper Navigation */}
      <nav aria-label="Onboarding Progress" className="mb-8">
        <ol className="flex items-center justify-between w-full border-b border-slate-200 pb-4">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <li key={step.number} className="flex-1 text-center">
                <button
                  type="button"
                  onClick={() => profile && setCurrentStep(step.number)}
                  disabled={!profile && step.number > 1}
                  className={`group inline-flex flex-col items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-lg p-2 transition-colors min-h-[44px] cursor-pointer ${
                    !profile && step.number > 1 ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Panels */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {currentStep === 1 && (
          <StepIdentity
            profile={profile}
            onRefresh={fetchProfile}
            onNext={() => setCurrentStep(2)}
            onPrev={() => {}}
          />
        )}
        {currentStep === 2 && (
          <StepProfession
            profile={profile}
            onRefresh={fetchProfile}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <StepServices
            profile={profile}
            onRefresh={fetchProfile}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <StepLocations
            profile={profile}
            onRefresh={fetchProfile}
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <StepSubmit
            profile={profile}
            onRefresh={fetchProfile}
            onNext={() => {}}
            onPrev={() => setCurrentStep(4)}
          />
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 1: Identity & Contact Verification
// -----------------------------------------------------------------------------
function StepIdentity({ profile, onRefresh, onNext }: StepProps) {
  const [phone, setPhone] = useState(profile?.user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears ?? 1);
  const [about, setAbout] = useState(profile?.about || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setMsg(null);
      const res = await freelancerClient.requestOtp(phone);
      setIsOtpSent(true);
      setMsg({ type: 'success', text: `OTP পাঠানো হয়েছে ${res.phone} নম্বরে। (Valid for 5 mins)` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'OTP পাঠাতে ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.verifyOtp(phone, otpCode);
      await onRefresh();
      setMsg({ type: 'success', text: 'মোবাইল নম্বর যাচাই সফল হয়েছে!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'যাচাই কোড সঠিক নয়' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.updateProfile({
        displayName,
        title,
        experienceYears: Number(experienceYears),
        about,
        photoUrl: photoUrl || null,
      });
      await onRefresh();
      onNext();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'প্রোফাইল আপডেট ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          ধাপ ১: ব্যক্তিগত তথ্য ও মোবাইল যাচাই (Personal Identity & Verification)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          বিশ্বস্ততা ও নিরাপত্তার জন্য প্রতিটি প্রফেশনাল প্রোফাইল যাচাইকৃত মোবাইল নম্বরের সাথে যুক্ত থাকে।
        </p>
      </div>

      {msg && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* If profile does not exist yet or phone unverified */}
      {!profile && (
        <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            মোবাইল নম্বর দিয়ে শুরু করুন (Start with Verified Phone)
          </h3>
          {!isOtpSent ? (
            <form onSubmit={handleSendOtp} className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                placeholder="01712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] bg-white text-sm"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'পাঠানো হচ্ছে...' : 'ওটিপি পাঠান / Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="৪ ডিজিটের ওটিপি / 4-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={4}
                required
                className="w-48 px-4 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] bg-white text-sm tracking-widest text-center font-bold"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'যাচাই হচ্ছে...' : 'যাচাই করুন / Verify'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Identity Form */}
      {profile && (
        <form onSubmit={handleSaveIdentity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পূর্ণ নাম (Full Name) *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পেশাগত পদবী (Professional Title) *
              </label>
              <input
                type="text"
                placeholder="যেমন: সিনিয়র ইলেকট্রিশিয়ান"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                কাজের অভিজ্ঞতা (Years of Experience) *
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রোফাইল ছবির লিংক (Photo URL)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              আপনার অভিজ্ঞতা ও কাজের বিবরণ (About & Bio) *
            </label>
            <textarea
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="আপনার দক্ষতা, সেবার মান ও কাজের অভিজ্ঞতা সম্পর্কে লিখুন..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none text-sm"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              পরবর্তী ধাপ / Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Step 2: Profession & Skills Selection
// -----------------------------------------------------------------------------
function StepProfession({ profile, onRefresh, onNext, onPrev }: StepProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState<string>(
    profile?.professionId || '',
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    profile?.skills?.map((s) => s.skillId) || [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    freelancerClient.getCategories().then(setCategories).catch(() => {});
    freelancerClient.getProfessions().then(setProfessions).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProfessionId) {
      freelancerClient
        .getSkills(selectedProfessionId)
        .then(setAvailableSkills)
        .catch(() => setAvailableSkills([]));
    } else {
      setAvailableSkills([]);
    }
  }, [selectedProfessionId]);

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      if (selectedSkillIds.length >= 10) {
        alert('সর্বোচ্চ ১০টি দক্ষতা নির্বাচন করতে পারবেন / Max 10 skills allowed');
        return;
      }
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessionId) {
      setMsg('দয়া করে আপনার মূল পেশা নির্বাচন করুন / Please select your profession');
      return;
    }
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.updateProfile({ professionId: selectedProfessionId });
      await freelancerClient.updateSkills(selectedSkillIds);
      await onRefresh();
      onNext();
    } catch (err: any) {
      setMsg(err.message || 'পেশা ও দক্ষতা সেভ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          ধাপ ২: পেশা ও দক্ষতা নির্বাচন (Profession & Skills)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          সঠিক ক্যাটাগরি ও পেশা নির্বাচন করলে গ্রাহকরা সহজেই আপনার সেবা খুঁজে পাবেন।
        </p>
      </div>

      {msg && (
        <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
          {msg}
        </div>
      )}

      {/* Profession Picker */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          আপনার মূল পেশা নির্বাচন করুন (Primary Profession) *
        </label>
        <select
          value={selectedProfessionId}
          onChange={(e) => {
            setSelectedProfessionId(e.target.value);
            setSelectedSkillIds([]); // Reset skills on profession switch
          }}
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] bg-white text-sm"
        >
          <option value="">পেশা নির্বাচন করুন / Select Profession...</option>
          {professions.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name} {prof.bnName ? `(${prof.bnName})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Skills Selection */}
      {selectedProfessionId && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              দক্ষতাসমূহ (Skills - সর্বোচ্চ ১০টি / Max 10)
            </label>
            <span className="text-xs text-slate-500">
              নির্বাচিত: {selectedSkillIds.length} / 10
            </span>
          </div>

          {availableSkills.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
              এই পেশার অধীনে এখনো কোনো তালিকাভুক্ত দক্ষতা পাওয়া যায়নি।
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              {availableSkills.map((sk) => {
                const isSelected = selectedSkillIds.includes(sk.id);
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => toggleSkill(sk.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{sk.name}</span>
                    {sk.bnName && <span className="opacity-80">({sk.bnName})</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors min-h-[44px] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          পূর্ববর্তী / Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
        >
          পরবর্তী ধাপ / Next Step
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Step 3: Services & Pricing
// -----------------------------------------------------------------------------
function StepServices({ profile, onRefresh, onNext, onPrev }: StepProps) {
  const [services, setServices] = useState<FreelancerServiceData[]>(
    profile?.services && profile.services.length > 0
      ? profile.services
      : [
          {
            title: '',
            priceType: 'FIXED',
            amount: 500,
            description: '',
          },
        ],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const addServiceRow = () => {
    if (services.length >= 10) {
      alert('সর্বোচ্চ ১০টি সেবা যোগ করা যাবে / Maximum 10 services allowed');
      return;
    }
    setServices([
      ...services,
      {
        title: '',
        priceType: 'FIXED',
        amount: 500,
        description: '',
      },
    ]);
  };

  const removeServiceRow = (idx: number) => {
    if (services.length <= 1) {
      alert('কমপক্ষে ১টি সেবা থাকা আবশ্যক / At least 1 service is required');
      return;
    }
    setServices(services.filter((_, i) => i !== idx));
  };

  const updateServiceField = (idx: number, field: keyof FreelancerServiceData, val: any) => {
    const updated = [...services];
    updated[idx] = { ...updated[idx], [field]: val } as FreelancerServiceData;
    setServices(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.updateServices(services);
      await onRefresh();
      onNext();
    } catch (err: any) {
      setMsg(err.message || 'সেবা তালিকা সংরক্ষণ করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            ধাপ ৩: সেবা ও মূল্য তালিকা (Services & Pricing)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            আপনার প্রদত্ত সেবা ও ফি যুক্ত করুন (১ থেকে ১০টি সেবা)।
          </p>
        </div>
        <button
          type="button"
          onClick={addServiceRow}
          disabled={services.length >= 10}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors min-h-[38px] cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          সেবা যোগ করুন / Add Service
        </button>
      </div>

      {msg && (
        <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {services.map((svc, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">সেবা #{idx + 1}</span>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeServiceRow(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                  title="মুছে ফেলুন / Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="সেবার নাম (যেমন: ফ্যান মেরামত বা নতুন ওয়্যারিং) *"
                  value={svc.title}
                  onChange={(e) => updateServiceField(idx, 'title', e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] bg-white text-sm"
                />
              </div>

              <div>
                <select
                  value={svc.priceType}
                  onChange={(e) =>
                    updateServiceField(idx, 'priceType', e.target.value as ServicePriceType)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[44px] bg-white text-sm"
                >
                  <option value="FIXED">নির্দিষ্ট / Fixed (৳)</option>
                  <option value="HOURLY">ঘন্টাপ্রতি / Hourly (৳)</option>
                  <option value="DAILY">দৈনিক / Daily (৳)</option>
                  <option value="NEGOTIABLE">আলোচনা সাপেক্ষে / Negotiable</option>
                </select>
              </div>
            </div>

            {svc.priceType !== 'NEGOTIABLE' && (
              <div className="w-full sm:w-48">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  মূল্য (টাকা / BDT) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={svc.amount ?? ''}
                  onChange={(e) => updateServiceField(idx, 'amount', Number(e.target.value))}
                  required
                  placeholder="৳ ৫০০"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none min-h-[40px] bg-white text-sm font-semibold"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors min-h-[44px] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          পূর্ববর্তী / Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
        >
          পরবর্তী ধাপ / Next Step
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Step 4: Coverage Locations (using CascadingLocationSelector)
// -----------------------------------------------------------------------------
function StepLocations({ profile, onRefresh, onNext, onPrev }: StepProps) {
  const [locations, setLocations] = useState<FreelancerLocationData[]>(
    profile?.locations && profile.locations.length > 0
      ? profile.locations
      : [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Buffer state for adding a new location
  const [currentSelection, setCurrentSelection] = useState<any>(null);
  const [isPrimaryForNew, setIsPrimaryForNew] = useState<boolean>(locations.length === 0);
  const [localityText, setLocalityText] = useState<string>('');

  const handleAddLocation = () => {
    if (!currentSelection || !currentSelection.isValid) {
      alert('দয়া করে পূর্ণ লোকেশন নির্বাচন করুন / Please complete the full location cascade');
      return;
    }
    if (locations.length >= 5) {
      alert('সর্বোচ্চ ৫টি এলাকা যুক্ত করা যাবে / Maximum 5 locations allowed');
      return;
    }

    const newLoc: FreelancerLocationData = {
      divisionId: currentSelection.divisionId,
      districtId: currentSelection.districtId,
      thanaId: currentSelection.thanaId,
      postOfficeId: currentSelection.postOfficeId,
      cityCorporationId: currentSelection.cityCorporationId || null,
      wardId: currentSelection.wardId || null,
      paurashavaId: currentSelection.paurashavaId || null,
      unionId: currentSelection.unionId || null,
      localityText: localityText || null,
      isPrimary: locations.length === 0 ? true : isPrimaryForNew,
    };

    // If new one is primary, unmark others
    const updated = locations.map((l) => ({
      ...l,
      isPrimary: newLoc.isPrimary ? false : l.isPrimary,
    }));

    setLocations([...updated, newLoc]);
    setLocalityText('');
    setCurrentSelection(null);
  };

  const handleSetPrimary = (idx: number) => {
    const updated = locations.map((loc, i) => ({
      ...loc,
      isPrimary: i === idx,
    }));
    setLocations(updated);
  };

  const handleRemoveLocation = (idx: number) => {
    const remaining = locations.filter((_, i) => i !== idx);
    // If we removed the primary, mark first as primary
    if (remaining.length > 0 && !remaining.some((l) => l.isPrimary)) {
      if (remaining[0]) {
        remaining[0].isPrimary = true;
      }
    }
    setLocations(remaining);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locations.length < 1) {
      setMsg('কমপক্ষে ১টি সেবা এলাকা থাকা আবশ্যক / At least 1 service location is required');
      return;
    }
    if (!locations.some((l) => l.isPrimary)) {
      setMsg('একটি এলাকাকে মূল এলাকা হিসেবে চিহ্নিত করুন / Please designate a primary location');
      return;
    }
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.updateLocations(locations);
      await onRefresh();
      onNext();
    } catch (err: any) {
      setMsg(err.message || 'লোকেশন সেভ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          ধাপ ৪: সেবার আওতাভুক্ত এলাকা (Service Locations)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          আপনি যে যে এলাকায় সেবা প্রদান করেন তা যুক্ত করুন (১ থেকে ৫টি এলাকা, একটি মূল এলাকা)।
        </p>
      </div>

      {msg && (
        <div role="alert" className="p-3.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
          {msg}
        </div>
      )}

      {/* Existing Location Cards */}
      {locations.length > 0 && (
        <div className="space-y-2.5">
          <label className="block text-xs font-semibold text-slate-700">
            সংযোজিত এলাকা সমূহ ({locations.length} / 5)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map((loc, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  loc.isPrimary
                    ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900">
                      {loc.localityText || `এলাকা #${idx + 1}`}
                    </span>
                    {loc.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        মূল এলাকা / Primary
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Division: {loc.divisionId}, District: {loc.districtId}, Thana: {loc.thanaId}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!loc.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Location Form (Max 5) */}
      {locations.length < 5 && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600" />
            নতুন এলাকা নির্বাচন করুন / Add Location
          </h3>

          <CascadingLocationSelector
            onChange={(sel) => setCurrentSelection(sel)}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="পাড়া / মহল্লা / রোড নম্বর (ঐচ্ছিক)"
              value={localityText}
              onChange={(e) => setLocalityText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px] bg-white text-xs"
            />
            <button
              type="button"
              onClick={handleAddLocation}
              disabled={!currentSelection?.isValid}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors min-h-[44px] cursor-pointer disabled:opacity-40"
            >
              যোগ করুন / Add to List
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors min-h-[44px] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          পূর্ববর্তী / Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || locations.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
        >
          পরবর্তী ধাপ / Next Step
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Step 5: Portfolio & Final Profile Submission
// -----------------------------------------------------------------------------
function StepSubmit({ profile, onRefresh, onPrev }: StepProps) {
  const [portfolio, setPortfolio] = useState<any[]>(profile?.portfolio || []);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAddPortfolio = async () => {
    if (!imageUrl) return;
    if (portfolio.length >= 10) {
      alert('সর্বোচ্চ ১০টি পোর্টফোলিও ছবি যুক্ত করতে পারবেন / Max 10 items');
      return;
    }
    const updated = [...portfolio, { imageUrl, caption, sortOrder: portfolio.length }];
    try {
      setIsSubmitting(true);
      setMsg(null);
      await freelancerClient.updatePortfolio(updated);
      await onRefresh();
      setPortfolio(updated);
      setImageUrl('');
      setCaption('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'পোর্টফোলিও সেভ ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePortfolio = async (idx: number) => {
    const updated = portfolio.filter((_, i) => i !== idx);
    try {
      setIsSubmitting(true);
      await freelancerClient.updatePortfolio(updated);
      await onRefresh();
      setPortfolio(updated);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'পোর্টফোলিও আপডেট ব্যর্থ হয়েছে' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProfile = async () => {
    try {
      setIsSubmitting(true);
      setMsg(null);
      const res = await freelancerClient.submitProfile();
      await onRefresh();
      setMsg({
        type: 'success',
        text: 'আপনার প্রোফাইল পর্যালোচনার জন্য সফলভাবে জমা দেওয়া হয়েছে! (Submitted for review)',
      });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'প্রোফাইল জমা দিতে সমস্যা হয়েছে' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isComplete =
    Boolean(profile?.displayName) &&
    Boolean(profile?.professionId) &&
    (profile?.locations?.length || 0) > 0 &&
    (profile?.services?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">
          ধাপ ৫: পোর্টফোলিও ও প্রোফাইল জমা (Portfolio & Final Submission)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          কাজের পূর্ববর্তী ছবি যুক্ত করুন এবং প্রোফাইলটি অ্যাডমিন অনুমোদনের জন্য জমা দিন।
        </p>
      </div>

      {msg && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {msg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* Portfolio Items Gallery */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          কাজের পোর্টফোলিও ছবি ({portfolio.length} / 10)
        </label>
        {portfolio.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {portfolio.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200 overflow-hidden group bg-slate-100"
              >
                <img
                  src={item.imageUrl}
                  alt={item.caption || 'Work sample'}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePortfolio(idx)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {item.caption && (
                  <p className="p-1.5 text-[10px] text-slate-700 truncate bg-white/90">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {portfolio.length < 10 && (
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="url"
              placeholder="ছবির লিংক / Image URL (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px] bg-white text-xs"
            />
            <input
              type="text"
              placeholder="ক্যাপশন (ঐচ্ছিক)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2 rounded-xl border border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-600 min-h-[44px] bg-white text-xs"
            />
            <button
              type="button"
              onClick={handleAddPortfolio}
              disabled={!imageUrl || isSubmitting}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              যোগ করুন
            </button>
          </div>
        )}
      </div>

      {/* Submission Checklist */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <h3 className="text-xs font-bold text-slate-800 mb-2">
          প্রোফাইল সম্পূর্ণতা যাচাই (Profile Completeness Check):
        </h3>
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            {profile?.displayName ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>পূর্ণ নাম ও পরিচয় (Full Name)</span>
          </li>
          <li className="flex items-center gap-2">
            {profile?.professionId ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>নির্বাচিত পেশা (Profession Selected)</span>
          </li>
          <li className="flex items-center gap-2">
            {(profile?.services?.length || 0) > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>কমপক্ষে ১টি সেবা (At least 1 Service)</span>
          </li>
          <li className="flex items-center gap-2">
            {(profile?.locations?.length || 0) > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span>কমপক্ষে ১টি সেবার এলাকা (At least 1 Service Area)</span>
          </li>
        </ul>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors min-h-[44px] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          পূর্ববর্তী / Back
        </button>

        {profile?.status === 'PENDING' ? (
          <div className="px-5 py-2.5 rounded-xl bg-amber-50 text-amber-800 font-semibold text-sm border border-amber-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            অনুমোদনের জন্য অপেক্ষমান (Under Review)
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmitProfile}
            disabled={!isComplete || isSubmitting}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors min-h-[44px] cursor-pointer shadow-sm disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'জমা হচ্ছে...' : 'প্রোফাইল জমা দিন / Submit Profile'}
          </button>
        )}
      </div>
    </div>
  );
}

