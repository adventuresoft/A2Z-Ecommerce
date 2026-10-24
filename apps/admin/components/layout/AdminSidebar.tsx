"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationConfig, NavItem } from "@/config/navigation";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "@/context/AuthContext";
import { AppModule } from "@/config/permissions";

const ITEM_MODULE_MAP: Record<string, AppModule> = {
  products: "products",
  "products-categories": "categories",
  "products-all": "products",
  "products-brands": "brands",
  "products-attributes": "attributes",
  "products-variants": "variants",
  orders: "orders",
  "orders-list": "orders",
  "orders-returns": "orders",
  inventory: "inventory",
  "inventory-overview": "inventory",
  "inventory-adjustments": "inventory",
  "inventory-movements": "inventory",
  "inventory-low-stock": "inventory",
  customers: "customers",
  "customers-list": "customers",
  "customers-groups": "customers",
  marketing: "marketing",
  "marketing-coupons": "marketing",
  payments: "payments",
  "payments-transactions": "payments",
  "payments-refunds": "payments",
  shipping: "shipping",
  "shipping-shipments": "shipping",
  "shipping-methods": "shipping",
  "shipping-zones": "shipping",
  engagement: "engagement",
  "engagement-reviews": "engagement",
  "engagement-notifications": "engagement",
  reports: "reports",
  "reports-sales": "reports",
  "reports-orders": "reports",
  "reports-inventory": "reports",
  "reports-customers": "reports",
  system: "settings",
  "system-users": "users",
  "system-taxes": "settings",
  "system-settings": "settings",
  "system-logs": "settings",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { closeMobileSidebar } = useAdminLayout();
  const { can } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string, defaultOpen: boolean) => {
    setOpenGroups((prev) => {
      const current = prev[groupId] !== undefined ? prev[groupId] : defaultOpen;
      return {
        ...prev,
        [groupId]: !current,
      };
    });
  };

  const isItemActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Filter visible items based on current user permissions
  const visibleItems = useMemo(() => {
    const filterItem = (item: NavItem): NavItem | null => {
      if (item.isHeader) return item;
      if (item.id === "dashboard") return item;

      const mod = ITEM_MODULE_MAP[item.id];
      if (mod && !can(mod, "read")) {
        return null;
      }

      if (item.children && item.children.length > 0) {
        const visibleChildren = item.children
          .map(filterItem)
          .filter((c): c is NavItem => c !== null);
        if (visibleChildren.length === 0) {
          return null;
        }
        return { ...item, children: visibleChildren };
      }

      return item;
    };

    const result: NavItem[] = [];
    let pendingHeader: NavItem | null = null;

    for (const raw of navigationConfig) {
      if (raw.isHeader) {
        pendingHeader = raw;
      } else {
        const filtered = filterItem(raw);
        if (filtered) {
          if (pendingHeader) {
            result.push(pendingHeader);
            pendingHeader = null;
          }
          result.push(filtered);
        }
      }
    }

    return result;
  }, [can]);

  return (
    <aside className="app-sidebar bg-dark text-white shadow" data-bs-theme="dark">
      {/* Brand Header */}
      <div className="sidebar-brand d-flex align-items-center justify-content-between px-3 py-2 border-bottom border-secondary border-opacity-25" style={{ height: "56px" }}>
        <Link
          href="/"
          className="brand-link text-decoration-none text-white d-flex align-items-center gap-2"
          onClick={closeMobileSidebar}
        >
          <div
            className="brand-image bg-primary text-white rounded d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-cart4 fs-6"></i>
          </div>
          <div className="d-flex flex-column" style={{ lineHeight: 1.15 }}>
            <span className="brand-text fw-bold text-white tracking-wide" style={{ fontSize: "0.86rem", letterSpacing: "0.03em" }}>
              A to Z E-COMMERCE
            </span>
            <span className="text-secondary opacity-75" style={{ fontSize: "0.65rem" }}>
              Admin Operations
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu with smooth scrolling */}
      <div
        className="sidebar-wrapper overflow-y-auto"
        style={{
          maxHeight: "calc(100vh - 56px)",
          scrollBehavior: "smooth",
        }}
      >
        <nav className="mt-2 px-2 pb-5">
          <ul className="nav sidebar-menu flex-column gap-1 list-unstyled m-0 p-0" role="menu">
            {visibleItems.map((item) => {
              if (item.isHeader) {
                return (
                  <li
                    key={item.id}
                    className="nav-header text-uppercase text-secondary fw-semibold px-2 pt-3 pb-1"
                    style={{ fontSize: "0.64rem", letterSpacing: "0.08em" }}
                  >
                    {item.title}
                  </li>
                );
              }

              // Parent with children
              if (item.children && item.children.length > 0) {
                const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                const defaultOpen = hasActiveChild || item.id === "products" || item.id === "catalog";
                const isGroupOpen = openGroups[item.id] !== undefined ? openGroups[item.id] : defaultOpen;

                return (
                  <li key={item.id} className={`nav-item ${isGroupOpen ? "menu-open" : ""}`}>
                    <button
                      type="button"
                      className={`nav-link w-100 text-start d-flex align-items-center justify-content-between rounded-2 border-0 text-decoration-none transition-all ${
                        hasActiveChild || isGroupOpen ? "text-white fw-semibold bg-secondary bg-opacity-25" : "text-light opacity-75 hover-opacity-100"
                      }`}
                      style={{ background: "transparent", fontSize: "0.82rem", padding: "0.42rem 0.65rem" }}
                      onClick={() => toggleGroup(item.id, defaultOpen)}
                      aria-expanded={isGroupOpen}
                    >
                      <div className="d-flex align-items-center gap-2">
                        {item.icon && <i className={`${item.icon} text-secondary-emphasis`} style={{ fontSize: "0.95rem" }}></i>}
                        <span>{item.title}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <i
                          className={`bi bi-chevron-right small text-secondary`}
                          style={{
                            fontSize: "0.7rem",
                            transform: isGroupOpen ? "rotate(90deg)" : "none",
                            transition: "transform 0.2s ease-in-out",
                          }}
                        ></i>
                      </div>
                    </button>

                    {/* Collapsible Submenu */}
                    {isGroupOpen && (
                      <ul className="nav nav-treeview d-block flex-column list-unstyled ps-3 pe-1 py-1 gap-1" role="menu">
                        {item.children.map((child) => {
                          const active = isItemActive(child.href);

                          return (
                            <li key={child.id} className="nav-item" role="none">
                              <Link
                                href={child.href || "#"}
                                className={`nav-link d-flex align-items-center justify-content-between rounded-2 text-decoration-none ${
                                  active
                                    ? "bg-primary text-white shadow-sm fw-semibold"
                                    : "text-light opacity-75 hover-opacity-100"
                                }`}
                                style={{ fontSize: "0.78rem", padding: "0.34rem 0.65rem" }}
                                onClick={closeMobileSidebar}
                                role="menuitem"
                                aria-current={active ? "page" : undefined}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  {child.icon ? (
                                    <i className={`${child.icon}`} style={{ fontSize: "0.85rem" }}></i>
                                  ) : (
                                    <i className="bi bi-circle" style={{ fontSize: "0.45rem" }}></i>
                                  )}
                                  <span>{child.title}</span>
                                </div>
                                {child.badge && (
                                  <span className={`badge bg-${child.badge.variant || "secondary"}`} style={{ fontSize: "0.58rem" }}>
                                    {child.badge.text}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Standalone leaf item
              const active = isItemActive(item.href);

              return (
                <li key={item.id} className="nav-item" role="none">
                  <Link
                    href={item.href || "#"}
                    className={`nav-link d-flex align-items-center justify-content-between rounded-2 text-decoration-none ${
                      active ? "bg-primary text-white shadow-sm fw-semibold" : "text-light opacity-80"
                    }`}
                    style={{ fontSize: "0.82rem", padding: "0.42rem 0.65rem" }}
                    onClick={closeMobileSidebar}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="d-flex align-items-center gap-2">
                      {item.icon && <i className={`${item.icon}`} style={{ fontSize: "0.95rem" }}></i>}
                      <span>{item.title}</span>
                    </div>
                    {item.badge && (
                      <span className={`badge bg-${item.badge.variant || "primary"}`} style={{ fontSize: "0.58rem" }}>
                        {item.badge.text}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
