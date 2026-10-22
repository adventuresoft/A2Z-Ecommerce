"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Truck, Lock, Headphones } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: <Truck className="w-5 h-5 text-blue-700" />,
    title: "Free Delivery",
    desc: "On orders over ৳2,000 across Bangladesh",
  },
  {
    icon: <RotateCcw className="w-5 h-5 text-orange-500" />,
    title: "Easy 7-Day Returns",
    desc: "Hassle-free replacement policy",
  },
  {
    icon: <Lock className="w-5 h-5 text-emerald-600" />,
    title: "100% Secure Payment",
    desc: "bKash, Nagad, Cards & Cash on Delivery",
  },
  {
    icon: <Headphones className="w-5 h-5 text-indigo-600" />,
    title: "Dedicated 24/7 Support",
    desc: "Help hotline: 09678-123456",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    title: "100% Authentic Products",
    desc: "Direct manufacturer brand warranty",
  },
];

export function TrustStrip() {
  return (
    <section className="py-8 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {VALUE_PROPS.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex items-center space-x-3.5 group"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                {prop.icon}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                  {prop.title}
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-snug mt-0.5 truncate">
                  {prop.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
