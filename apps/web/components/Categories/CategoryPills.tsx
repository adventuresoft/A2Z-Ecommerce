"use client";

import React from "react";
import {
  Cpu,
  Laptop,
  Gamepad2,
  Smartphone,
  Headphones,
  Monitor,
  Camera,
  Wifi,
  Speaker,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { CATEGORIES, CategoryItem } from "../../data/mock-catalog";

const ICON_MAP: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />,
  Laptop: <Laptop className="w-5 h-5 sm:w-6 sm:h-6" />,
  Gamepad2: <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />,
  Smartphone: <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />,
  Headphones: <Headphones className="w-5 h-5 sm:w-6 sm:h-6" />,
  Monitor: <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />,
  Camera: <Camera className="w-5 h-5 sm:w-6 sm:h-6" />,
  Wifi: <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />,
  Speaker: <Speaker className="w-5 h-5 sm:w-6 sm:h-6" />,
  LayoutGrid: <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />,
};

export function CategoryPills() {
  return (
    <section id="categories" className="py-8 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-0.5">
              Browse Catalog
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Explore Popular Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Computer hardware, smartphones, gaming accessories and wireless gear
            </p>
          </div>
          <a
            href="#"
            className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Responsive Horizontal Scroll on Mobile, Grid on Tablet/Desktop */}
        <div className="flex overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-5 md:grid-cols-10 gap-3 sm:gap-4 no-scrollbar">
          {CATEGORIES.map((cat: CategoryItem, idx) => {
            const isAll = cat.id === "all";
            return (
              <motion.a
                key={cat.id}
                href={`#${cat.id}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center group cursor-pointer text-center shrink-0 w-20 sm:w-auto"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:shadow-md ${
                    isAll
                      ? "bg-blue-50 text-blue-700 border-2 border-dashed border-blue-300 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700"
                      : "bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-blue-700 group-hover:text-white group-hover:border-blue-700"
                  }`}
                >
                  {ICON_MAP[cat.iconName] || <LayoutGrid className="w-6 h-6" />}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors mt-2 leading-tight truncate w-full">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  {cat.itemCount}
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
