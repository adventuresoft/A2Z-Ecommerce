"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBreadcrumbs, BreadcrumbItem } from "@/config/navigation";

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbList = items || getBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb navigation">
      <ol className="breadcrumb mb-0 small align-items-center">
        {breadcrumbList.map((item, index) => {
          const isLast = item.active || index === breadcrumbList.length - 1;

          return (
            <li
              key={`${item.title}-${index}`}
              className={`breadcrumb-item ${isLast ? "active text-body-secondary" : ""}`}
              aria-current={isLast ? "page" : undefined}
            >
              {!isLast && item.href ? (
                <Link href={item.href} className="text-decoration-none text-primary fw-medium">
                  {index === 0 && <i className="bi bi-house-door me-1 small" aria-hidden="true"></i>}
                  {item.title}
                </Link>
              ) : (
                <span className="fw-medium text-body-secondary">
                  {index === 0 && <i className="bi bi-house-door me-1 small" aria-hidden="true"></i>}
                  {item.title}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
