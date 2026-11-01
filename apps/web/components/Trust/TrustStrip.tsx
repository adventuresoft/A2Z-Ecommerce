"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Truck, Lock, Headphones } from "lucide-react";
import { Tilt3DCard } from "../UI/Tilt3DCard";

const VALUE_PROPS = [
  {
    icon: Truck,
    iconColor: "text-blue-700 bg-blue-50 border-blue-100",
    title: "Express 64-District Courier",
    desc: "24h Dhaka & FREE over ৳1,00,000",
  },
  {
    icon: RotateCcw,
    iconColor: "text-orange-600 bg-orange-50 border-orange-100",
    title: "7-Day Easy Replacement",
    desc: "Instant swap on factory defects",
  },
  {
    icon: Lock,
    iconColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
    title: "SSL & COD Protected",
    desc: "PayStation, bKash, Nagad & COD",
  },
  {
    icon: Headphones,
    iconColor: "text-indigo-700 bg-indigo-50 border-indigo-100",
    title: "7-Day Tech Concierge",
    desc: "Hotline: 09678-123456",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-blue-700 bg-blue-50 border-blue-100",
    title: "100% Authentic Stock",
    desc: "Official brand serial warranty",
  },
];

export function TrustStrip() {
  return (
    <section className="py-10 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <Tilt3DCard key={prop.title} maxTilt={6} scale={1.015}>
                <div className="surface-3d rounded-2xl p-4 hover:border-blue-300 transition-[border-color,box-shadow] flex items-center gap-3.5 group h-full">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${prop.iconColor}`}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-extrabold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                      {prop.title}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
                      {prop.desc}
                    </span>
                  </div>
                </div>
              </Tilt3DCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
