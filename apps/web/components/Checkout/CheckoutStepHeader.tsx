"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, Sparkles, Check } from "lucide-react";

interface CheckoutStepHeaderProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  {
    step: 1 as const,
    label: "Shopping Cart",
    sublabel: "Review & Delivery Zone",
    href: "/cart",
    icon: ShoppingBag,
  },
  {
    step: 2 as const,
    label: "Secure Checkout",
    sublabel: "Address & Payment",
    href: "/checkout",
    icon: ShieldCheck,
  },
  {
    step: 3 as const,
    label: "Thank You",
    sublabel: "Verified Receipt",
    href: undefined,
    icon: Sparkles,
  },
];

export function CheckoutStepHeader({ currentStep }: CheckoutStepHeaderProps) {
  return (
    <nav
      aria-label="Checkout progress"
      className="surface-3d rounded-2xl p-3 sm:p-4 mb-6 sm:mb-8"
    >
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map((item, idx) => {
          const Icon = item.icon;
          const isCompleted = currentStep > item.step;
          const isActive = currentStep === item.step;

          const content = (
            <div
              className={`relative flex items-center gap-2.5 sm:gap-3.5 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border transition-[border-color,background-color,box-shadow,transform] duration-200 ${
                isActive
                  ? "bg-slate-900 border-slate-800 text-white shadow-md"
                  : isCompleted
                  ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950 hover:bg-emerald-50"
                  : "bg-slate-50/70 border-slate-200/70 text-slate-400"
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 font-black text-xs tabular-nums ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/40"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200/80 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.75]" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider tabular-nums ${
                      isActive
                        ? "text-blue-300"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
                    }`}
                  >
                    Step 0{item.step}
                  </span>
                </div>
                <p
                  className={`text-xs sm:text-sm font-black truncate ${
                    isActive
                      ? "text-white"
                      : isCompleted
                      ? "text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`hidden md:block text-[11px] truncate ${
                    isActive
                      ? "text-slate-300"
                      : isCompleted
                      ? "text-emerald-700/80"
                      : "text-slate-400"
                  }`}
                >
                  {item.sublabel}
                </p>
              </div>

              {idx < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`hidden lg:block w-2 h-2 rounded-full shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isActive
                      ? "bg-blue-400 animate-pulse"
                      : "bg-slate-300"
                  }`}
                />
              )}
            </div>
          );

          return (
            <li key={item.step} aria-current={isActive ? "step" : undefined}>
              {isCompleted && item.href && currentStep !== 3 ? (
                <Link
                  href={item.href}
                  className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

