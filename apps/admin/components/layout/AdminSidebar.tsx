"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  "products-tags": "products",
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

interface FlyoutState {
  item: NavItem;
  top: number;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { closeMobileSidebar } = useAdminLayout();
  const { can } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [flyout, setFlyout] = useState<FlyoutState | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleCloseFlyout = useCallback(() => {
    clearCloseTimer();
    closeTimeoutRef.current = setTimeout(() => {
      setFlyout(null);
    }, 130);
  }, [clearCloseTimer]);

  const handleParentMouseEnter = useCallback(
    (item: NavItem, hasActiveChild: boolean, e: React.MouseEvent<HTMLLIElement>) => {
      if (typeof window !== "undefined" && window.innerWidth < 992) return;
      clearCloseTimer();
      // Active menu hover flyout will NOT open; active menu keeps inline submenu
      if (hasActiveChild) {
        setFlyout(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const estimatedHeight = Math.min((item.children?.length || 1) * 34 + 44, 340);
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
      const clampedTop = Math.max(12, Math.min(rect.top, viewportHeight - estimatedHeight - 16));

      setFlyout({
        item,
        top: clampedTop,
      });
    },
    [clearCloseTimer]
  );

  // Close flyout on scroll or route change
  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

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
    <aside
      ref={sidebarRef}
      className="app-sidebar text-white d-flex flex-column justify-content-between"
      data-bs-theme="dark"
    >
      <div className="d-flex flex-column overflow-hidden flex-grow-1">
        {/* 3D Brand Header */}
        <div
          className="sidebar-brand d-flex align-items-center justify-content-between px-2-5 py-2 border-bottom border-secondary border-opacity-15 flex-shrink-0"
          style={{ height: "56px", paddingLeft: "0.75rem", paddingRight: "0.75rem" }}
        >
          <Link
            href="/"
            className="brand-link text-decoration-none text-white d-flex align-items-center gap-2 w-100"
            onClick={() => {
              setFlyout(null);
              closeMobileSidebar();
            }}
          >
            <div
              className="brand-image bg-white rounded-2 d-flex align-items-center justify-content-center flex-shrink-0 p-1 overflow-hidden"
              style={{
                width: "36px",
                height: "36px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
              }}
            >
              <Image
                src="/Logo.png"
                alt="A to Z E-Commerce Logo"
                width={30}
                height={28}
                className="img-fluid object-fit-contain"
                priority
              />
            </div>
            <div className="d-flex flex-column overflow-hidden" style={{ lineHeight: 1.15 }}>
              <div className="d-flex align-items-center gap-1">
                <span
                  className="brand-text fw-bold text-white text-truncate"
                  style={{ fontSize: "0.8rem", letterSpacing: "0.02em" }}
                >
                  A to Z E-COMMERCE
                </span>
              </div>
              <div className="d-flex align-items-center gap-1 mt-0-5">
                <span
                  className="rounded-circle bg-success d-inline-block"
                  style={{ width: "5px", height: "5px", boxShadow: "0 0 5px #10b981" }}
                ></span>
                <span className="text-secondary opacity-85 text-truncate" style={{ fontSize: "0.62rem" }}>
                  Command Console
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Menu with smooth scrolling */}
        <div
          className="sidebar-wrapper overflow-y-auto flex-grow-1"
          style={{
            scrollBehavior: "smooth",
          }}
          onScroll={() => {
            if (flyout) setFlyout(null);
          }}
        >
          <nav className="mt-1 px-0 pb-4" aria-label="Primary Administration Navigation">
            <ul className="nav sidebar-menu flex-column gap-0-5 list-unstyled m-0 p-0" role="menu">
              {visibleItems.map((item) => {
                if (item.isHeader) {
                  return (
                    <li
                      key={item.id}
                      className="nav-header text-uppercase fw-bold px-3 pt-2-5 pb-1 d-flex align-items-center gap-2"
                      style={{
                        fontSize: "0.58rem",
                        letterSpacing: "0.08em",
                        color: "rgba(148, 163, 184, 0.65)",
                        paddingTop: "0.7rem",
                      }}
                    >
                      <span>{item.title}</span>
                      <span
                        className="flex-grow-1 border-top"
                        style={{ borderColor: "rgba(148, 163, 184, 0.12)" }}
                      ></span>
                    </li>
                  );
                }

                // Parent with children
                if (item.children && item.children.length > 0) {
                  const hasActiveChild = item.children.some((child) => isItemActive(child.href));
                  const isHoveredFlyout = !hasActiveChild && flyout?.item.id === item.id;
                  const defaultOpen = hasActiveChild;
                  const isMobileGroupOpen = openGroups[item.id] !== undefined ? openGroups[item.id] : defaultOpen;
                  const isInlineOpen = hasActiveChild || isMobileGroupOpen;
                  const firstChildHref = item.children[0]?.href || "#";

                  return (
                    <li
                      key={item.id}
                      className={`nav-item position-relative az-flyout-trigger-item ${
                        isHoveredFlyout ? "flyout-open" : ""
                      } ${hasActiveChild ? "has-active-child" : ""}`}
                      onMouseEnter={(e) => handleParentMouseEnter(item, hasActiveChild, e)}
                      onMouseLeave={scheduleCloseFlyout}
                    >
                      <div className="d-flex align-items-center position-relative">
                        {/* Desktop primary trigger row (Hover flyout ONLY when NOT active; when active, submenu stays open below) */}
                        <Link
                          href={firstChildHref}
                          className={`nav-link w-100 text-start d-none d-lg-flex align-items-center justify-content-between text-decoration-none az-sidebar-flyout-parent ${
                            hasActiveChild || isHoveredFlyout ? "active-flyout-parent fw-semibold" : ""
                          }`}
                          onClick={() => {
                            setFlyout(null);
                            closeMobileSidebar();
                          }}
                          aria-haspopup={!hasActiveChild}
                          aria-expanded={hasActiveChild ? true : isHoveredFlyout}
                        >
                          <div className="d-flex align-items-center gap-2 text-truncate">
                            {item.icon && (
                              <span className="az-sidebar-icon-box me-0-5">
                                <i
                                  className={`${item.icon} ${
                                    hasActiveChild || isHoveredFlyout ? "text-white" : "text-light opacity-85"
                                  }`}
                                  style={{ fontSize: "0.82rem" }}
                                  aria-hidden="true"
                                ></i>
                              </span>
                            )}
                            <span className="text-truncate">{item.title}</span>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            {item.badge && (
                              <span
                                className={`badge ${
                                  hasActiveChild || isHoveredFlyout
                                    ? "bg-white text-primary fw-bold"
                                    : `bg-${item.badge.variant || "success"} bg-opacity-25 text-light`
                                }`}
                                style={{ fontSize: "0.52rem", padding: "0.18em 0.42em" }}
                              >
                                {item.badge.text}
                              </span>
                            )}
                            <i
                              className="bi bi-chevron-right small opacity-75"
                              aria-hidden="true"
                              style={{
                                fontSize: "0.62rem",
                                transform: hasActiveChild ? "rotate(90deg)" : "none",
                                transition: "transform 0.2s ease",
                              }}
                            ></i>
                          </div>

                          {/* Left-pointing dark triangle notch ONLY when non-active item is hovered */}
                          {isHoveredFlyout && <span className="az-flyout-notch" aria-hidden="true" />}
                        </Link>

                        {/* Mobile (< 992px) accordion button fallback */}
                        <button
                          type="button"
                          className={`nav-link w-100 text-start d-flex d-lg-none align-items-center justify-content-between text-decoration-none az-sidebar-group-btn mx-2 ${
                            hasActiveChild || isMobileGroupOpen ? "group-open fw-semibold" : ""
                          }`}
                          style={{ background: "transparent" }}
                          onClick={() => toggleGroup(item.id, defaultOpen)}
                          aria-expanded={isMobileGroupOpen}
                        >
                          <div className="d-flex align-items-center gap-2 text-truncate">
                            {item.icon && (
                              <span className="az-sidebar-icon-box me-0-5">
                                <i
                                  className={`${item.icon} ${hasActiveChild ? "text-info" : "text-light opacity-85"}`}
                                  style={{ fontSize: "0.82rem" }}
                                  aria-hidden="true"
                                ></i>
                              </span>
                            )}
                            <span className="text-truncate">{item.title}</span>
                          </div>
                          <i
                            className="bi bi-chevron-right small text-secondary"
                            aria-hidden="true"
                            style={{
                              fontSize: "0.64rem",
                              transform: isMobileGroupOpen ? "rotate(90deg)" : "none",
                              transition: "transform 0.22s ease",
                            }}
                          ></i>
                        </button>
                      </div>

                      {/* Inline Submenu: Shown on Desktop when Parent is Active (hasActiveChild), and on Mobile when opened */}
                      {isInlineOpen && (
                        <ul
                          className={`nav nav-treeview flex-column list-unstyled py-1 mt-0-5 gap-0-5 az-treeview-list me-2 ${
                            hasActiveChild ? "d-flex" : "d-flex d-lg-none"
                          }`}
                          role="menu"
                        >
                          {item.children.map((child) => {
                            const active = isItemActive(child.href);
                            return (
                              <li key={child.id} className="nav-item" role="none">
                                <Link
                                  href={child.href || "#"}
                                  className={`nav-link d-flex align-items-center justify-content-between text-decoration-none az-sidebar-link ${
                                    active ? "active" : ""
                                  }`}
                                  onClick={closeMobileSidebar}
                                  role="menuitem"
                                  aria-current={active ? "page" : undefined}
                                >
                                  <div className="d-flex align-items-center gap-2 text-truncate">
                                    {child.icon ? (
                                      <i
                                        className={`${child.icon} ${active ? "text-info" : "opacity-65"}`}
                                        style={{ fontSize: "0.76rem" }}
                                        aria-hidden="true"
                                      ></i>
                                    ) : (
                                      <i
                                        className="bi bi-circle-fill"
                                        style={{ fontSize: "0.32rem" }}
                                        aria-hidden="true"
                                      ></i>
                                    )}
                                    <span className="text-truncate">{child.title}</span>
                                  </div>
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
                  <li
                    key={item.id}
                    className="nav-item"
                    role="none"
                    onMouseEnter={() => {
                      clearCloseTimer();
                      setFlyout(null);
                    }}
                  >
                    <Link
                      href={item.href || "#"}
                      className={`nav-link d-flex align-items-center justify-content-between text-decoration-none az-sidebar-flyout-parent ${
                        active ? "active-flyout-parent fw-semibold" : ""
                      }`}
                      onClick={() => {
                        setFlyout(null);
                        closeMobileSidebar();
                      }}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                    >
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        {item.icon && (
                          <span className="az-sidebar-icon-box me-0-5">
                            <i className={`${item.icon}`} style={{ fontSize: "0.82rem" }} aria-hidden="true"></i>
                          </span>
                        )}
                        <span className="text-truncate">{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`badge bg-${item.badge.variant || "primary"}`}
                          style={{ fontSize: "0.52rem" }}
                        >
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
      </div>

      {/* Desktop Right-Side Floating Flyout Submenu (Only for non-active hovered menus) */}
      {flyout && flyout.item.children && (
        <div
          className="az-sidebar-flyout-panel d-none d-lg-block"
          style={{ top: `${flyout.top}px` }}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleCloseFlyout}
          role="menu"
          aria-label={`${flyout.item.title} submenu`}
        >
          {/* Flyout Header Title */}
          <div className="az-flyout-header px-2-5 py-1-5 border-bottom d-flex align-items-center justify-content-between" style={{ padding: "0.42rem 0.75rem" }}>
            <span className="fw-bold text-white" style={{ fontSize: "0.73rem", letterSpacing: "0.02em" }}>
              {flyout.item.title}
            </span>
            <span className="badge bg-primary bg-opacity-25 text-info" style={{ fontSize: "0.55rem" }}>
              {flyout.item.children.length}
            </span>
          </div>

          {/* Flyout Submenu Items */}
          <ul className="list-unstyled m-0" style={{ padding: "0.3rem 0.25rem" }}>
            {flyout.item.children.map((child) => {
              const active = isItemActive(child.href);
              return (
                <li key={child.id} role="none">
                  <Link
                    href={child.href || "#"}
                    className={`az-flyout-sublink d-flex align-items-center justify-content-between text-decoration-none rounded-2 ${
                      active ? "active" : ""
                    }`}
                    onClick={() => {
                      setFlyout(null);
                      closeMobileSidebar();
                    }}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="d-flex align-items-center gap-2 text-truncate">
                      {child.icon && (
                        <i
                          className={`${child.icon} ${active ? "text-info" : "opacity-70"}`}
                          style={{ fontSize: "0.76rem" }}
                          aria-hidden="true"
                        ></i>
                      )}
                      <span className="text-truncate">{child.title}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bottom 3D System Status Card inside Sidebar */}
      <div
        className="p-3 border-top flex-shrink-0"
        style={{
          borderColor: "rgba(255, 255, 255, 0.08)",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          className="p-2-5 rounded-3 d-flex align-items-center justify-content-between"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            padding: "0.55rem 0.75rem",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-indicator" aria-hidden="true"></span>
            <div style={{ lineHeight: 1.15 }}>
              <div className="text-white fw-semibold" style={{ fontSize: "0.73rem" }}>
                Core Engine Active
              </div>
              <small className="text-secondary" style={{ fontSize: "0.64rem" }}>
                Storefront & REST API
              </small>
            </div>
          </div>
          <Link
            href="/system/settings"
            className="btn btn-sm p-1 text-secondary hover-text-white"
            title="System Settings"
            aria-label="System Settings"
            onClick={() => {
              setFlyout(null);
              closeMobileSidebar();
            }}
          >
            <i className="bi bi-sliders2" style={{ fontSize: "0.85rem" }}></i>
          </Link>
        </div>
      </div>
    </aside>
  );
}
