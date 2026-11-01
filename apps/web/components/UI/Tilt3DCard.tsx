"use client";

import React, { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

export interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  maxTiltDeg?: number;
  scale?: number;
  glare?: boolean;
  glareOpacity?: number;
  disabled?: boolean;
}

/**
 * Interactive 3D perspective card with compositor-friendly transform tilt
 * and dynamic specular glare highlight. Automatically honors prefers-reduced-motion.
 */
export function Tilt3DCard({
  children,
  className = "",
  maxTilt = 6,
  maxTiltDeg,
  scale = 1.01,
  glare = true,
  glareOpacity = 0.14,
  disabled = false,
}: Tilt3DCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)"
  );
  const [glarePos, setGlarePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  const effectiveTilt = maxTiltDeg ?? maxTilt;
  const isDisabled = disabled || Boolean(prefersReducedMotion);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const rotateY = (relX - 0.5) * effectiveTilt * 2;
    const rotateX = (0.5 - relY) * effectiveTilt * 2;

    setTransformStyle(
      `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`
    );
    if (glare) {
      setGlarePos({
        x: Math.round(relX * 100),
        y: Math.round(relY * 100),
        active: true,
      });
    }
  };

  const handleMouseLeave = () => {
    if (isDisabled) return;
    setTransformStyle("perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePos((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isDisabled ? "none" : transformStyle,
        transition: isDisabled
          ? "none"
          : "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
      }}
      className={`relative will-change-transform ${className}`}
    >
      {children}

      {/* Dynamic Specular Glare Overlay */}
      {!isDisabled && glare && (
        <div
          aria-hidden="true"
          style={{
            opacity: glarePos.active ? glareOpacity : 0,
            background: `radial-gradient(circle 320px at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 80%)`,
            transition: "opacity 0.25s ease-out",
          }}
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] mix-blend-overlay"
        />
      )}
    </div>
  );
}