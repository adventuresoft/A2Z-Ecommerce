"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "@/context/AuthContext";
import { navigationConfig, NavItem } from "@/config/navigation";
import { engagementService, AdminNotification } from "@/services/engagement";

export function AdminNavbar() {
  const { toggleSidebar, theme, toggleTheme } = useAdminLayout();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([]);
  const profileRef = useRef<HTMLLIElement>(null);
  const notificationsRef = useRef<HTMLLIElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Flatten navigation items for Quick Jump Search
  const searchableModules = useMemo(() => {
    const items: { id: string; title: string; parent?: string; href: string; icon: string }[] = [];
    const traverse = (list: NavItem[], parentTitle?: string) => {
      for (const node of list) {
        if (node.isHeader) continue;
        if (node.href) {
          items.push({
            id: node.id,
            title: node.title,
            parent: parentTitle,
            href: node.href,
            icon: node.icon || "bi bi-arrow-right-circle",
          });
        }
        if (node.children) {
          traverse(node.children, node.title);
        }
      }
    };
    traverse(navigationConfig);
    return items;
  }, []);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchableModules.slice(0, 6);
    return searchableModules
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.parent && m.parent.toLowerCase().includes(q)) ||
          m.href.toLowerCase().includes(q)
      )
      .slice(0, 7);
  }, [searchQuery, searchableModules]);

  const loadNotifications = async () => {
    try {
      const [stats, list] = await Promise.all([
        engagementService.getNotificationStats().catch(() => null),
        engagementService.getNotifications({ limit: 5 }).catch(() => null),
      ]);
      if (stats) {
        setUnreadCount(stats.unreadCount);
      }
      if (list) {
        setRecentNotifications(list.items);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside & Ctrl+K shortcut
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 20);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "ORDER_STATUS":
        return "bi bi-cart-check-fill text-success";
      case "PAYMENT":
        return "bi bi-cash-stack text-primary";
      case "LOW_STOCK":
        return "bi bi-exclamation-triangle-fill text-warning";
      case "PROMOTION":
        return "bi bi-megaphone-fill text-info";
      default:
        return "bi bi-bell-fill text-secondary";
    }
  };

  return (
    <nav className="app-header navbar navbar-expand px-3 px-md-4 sticky-top" style={{ minHeight: "64px" }}>
      <div className="container-fluid p-0 d-flex align-items-center justify-content-between gap-3">
        {/* Left: Sidebar Toggle & Quick Command Search */}
        <div className="d-flex align-items-center gap-2 gap-md-3 flex-grow-1" style={{ maxWidth: "520px" }}>
          <button
            type="button"
            className="btn tile-3d p-2 d-flex align-items-center justify-content-center text-body flex-shrink-0"
            style={{ width: "38px", height: "38px" }}
            onClick={toggleSidebar}
            aria-label="Toggle navigation sidebar"
            title="Toggle sidebar"
          >
            <i className="bi bi-layout-sidebar-inset fs-6" aria-hidden="true"></i>
          </button>

          {/* Interactive Module Command Search */}
          <div className="position-relative flex-grow-1 d-none d-sm-block" ref={searchRef}>
            <div
              className="input-group input-group-sm tile-3d overflow-hidden"
              style={{ borderRadius: "0.65rem" }}
            >
              <span className="input-group-text bg-transparent border-0 text-secondary pe-1">
                <i className="bi bi-search" style={{ fontSize: "0.8rem" }} aria-hidden="true"></i>
              </span>
              <input
                ref={searchInputRef}
                type="search"
                className="form-control border-0 bg-transparent shadow-none ps-2"
                placeholder="Jump to module, orders, products..."
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                aria-label="Quick module search"
                style={{ fontSize: "0.8125rem" }}
              />
              <span className="input-group-text bg-transparent border-0 pe-2 d-none d-md-flex align-items-center">
                <kbd
                  className="badge bg-body-secondary text-secondary border fw-normal"
                  style={{ fontSize: "0.65rem", padding: "0.18rem 0.4rem" }}
                >
                  Ctrl K
                </kbd>
              </span>
            </div>

            {searchOpen && (
              <div
                className="dropdown-menu show w-100 mt-2 p-2 border"
                style={{ zIndex: 1060 }}
              >
                <div className="px-2 py-1 d-flex align-items-center justify-content-between">
                  <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: "0.64rem", letterSpacing: "0.06em" }}>
                    {searchQuery.trim() ? "Matching Modules" : "Quick Navigation"}
                  </span>
                  <span className="text-secondary" style={{ fontSize: "0.65rem" }}>
                    ESC to close
                  </span>
                </div>
                <div className="d-flex flex-column gap-1 mt-1">
                  {filteredModules.length === 0 ? (
                    <div className="p-3 text-center text-secondary small">
                      No matching admin routes for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredModules.map((mod) => (
                      <button
                        key={mod.id}
                        type="button"
                        className="dropdown-item rounded-2 py-2 px-2-5 d-flex align-items-center justify-content-between text-start"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                          router.push(mod.href);
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span
                            className="rounded-2 bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center"
                            style={{ width: "26px", height: "26px" }}
                          >
                            <i className={`${mod.icon}`} style={{ fontSize: "0.8rem" }}></i>
                          </span>
                          <div>
                            <div className="fw-medium text-body" style={{ fontSize: "0.8125rem", lineHeight: 1.2 }}>
                              {mod.title}
                            </div>
                            {mod.parent && (
                              <small className="text-secondary" style={{ fontSize: "0.68rem" }}>
                                {mod.parent}
                              </small>
                            )}
                          </div>
                        </div>
                        <code className="text-secondary small" style={{ fontSize: "0.68rem" }}>
                          {mod.href}
                        </code>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Navbar Actions */}
        <ul className="navbar-nav ms-auto align-items-center gap-2">
          {/* Quick Add Product Button (Desktop) */}
          <li className="nav-item d-none d-lg-block">
            <Link
              href="/catalog/products/new"
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1-5 px-3"
              style={{ height: "36px" }}
            >
              <i className="bi bi-plus-circle-fill" aria-hidden="true"></i>
              <span>New Product</span>
            </Link>
          </li>

          {/* Theme Toggle (3D Tactile Button) */}
          <li className="nav-item">
            <button
              type="button"
              className="btn tile-3d p-0 d-flex align-items-center justify-content-center"
              style={{ width: "38px", height: "38px" }}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <i className="bi bi-sun-fill text-warning" style={{ fontSize: "1rem" }} aria-hidden="true"></i>
              ) : (
                <i className="bi bi-moon-stars-fill text-primary" style={{ fontSize: "0.95rem" }} aria-hidden="true"></i>
              )}
            </button>
          </li>

          {/* Notifications Dropdown */}
          <li className="nav-item dropdown position-relative" ref={notificationsRef}>
            <button
              type="button"
              className="btn tile-3d p-0 d-flex align-items-center justify-content-center position-relative"
              style={{ width: "38px", height: "38px" }}
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                loadNotifications();
              }}
              aria-expanded={notificationsOpen}
              aria-haspopup="true"
              aria-label="Notifications"
            >
              <i className="bi bi-bell-fill text-body" style={{ fontSize: "0.95rem" }} aria-hidden="true"></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger tabular-nums shadow-sm"
                  style={{ fontSize: "0.62rem", transform: "translate(-65%, 25%)" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show mt-2 p-0 overflow-hidden"
                style={{ width: "340px", zIndex: 1055 }}
              >
                <div
                  className="p-3 text-white d-flex justify-content-between align-items-center"
                  style={{ background: "var(--az-accent-gradient)" }}
                >
                  <div>
                    <h6 className="mb-0 fw-semibold text-white">System Alerts</h6>
                    <small className="text-white text-opacity-75">
                      {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
                    </small>
                  </div>
                  <Link
                    href="/engagement/notifications"
                    className="btn btn-sm btn-light py-1 px-2 small text-primary fw-semibold"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View All
                  </Link>
                </div>
                <div className="list-group list-group-flush small" style={{ maxHeight: "310px", overflowY: "auto" }}>
                  {recentNotifications.length === 0 ? (
                    <div className="p-4 text-center text-secondary">
                      <i className="bi bi-check2-circle fs-3 text-success d-block mb-1"></i>
                      <span>All caught up! No new notifications.</span>
                    </div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.linkUrl || "/engagement/notifications"}
                        className={`list-group-item list-group-item-action py-2-5 px-3 ${
                          notif.isRead ? "" : "bg-primary bg-opacity-10"
                        }`}
                        onClick={() => {
                          if (!notif.isRead) {
                            engagementService.markNotificationAsRead(notif.id).catch(() => {});
                          }
                          setNotificationsOpen(false);
                        }}
                      >
                        <div className="d-flex align-items-start gap-2">
                          <i className={`${getNotifIcon(notif.type)} fs-5 mt-0-5`}></i>
                          <div className="overflow-hidden w-100">
                            <div className="d-flex justify-content-between align-items-baseline">
                              <span className="fw-semibold text-body text-truncate" style={{ maxWidth: "190px" }}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span className="badge rounded-pill bg-primary" style={{ fontSize: "0.55rem" }}>
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-secondary text-truncate" style={{ fontSize: "0.75rem" }}>
                              {notif.message}
                            </div>
                            <div className="text-secondary text-end mt-1" style={{ fontSize: "0.65rem" }}>
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 text-center border-top bg-body-tertiary">
                  <Link
                    href="/engagement/notifications"
                    className="text-decoration-none small text-primary fw-semibold"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Open Notification Center <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            )}
          </li>

          {/* User Profile 3D Capsule Menu */}
          <li className="nav-item dropdown position-relative" ref={profileRef}>
            <button
              type="button"
              className="btn tile-3d d-flex align-items-center gap-2 py-1 px-2 text-decoration-none"
              style={{ minHeight: "38px" }}
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="User profile menu"
            >
              <div
                className="text-white rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: "30px",
                  height: "30px",
                  fontSize: "0.78rem",
                  background: "var(--az-accent-gradient)",
                }}
              >
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "AD"}
              </div>
              <div className="d-none d-md-block text-start pe-1" style={{ lineHeight: "1.15" }}>
                <span className="d-block fw-semibold text-body" style={{ fontSize: "0.78rem" }}>
                  {user?.name || "Administrator"}
                </span>
                <span className="text-secondary" style={{ fontSize: "0.64rem" }}>
                  {user?.role?.replace("_", " ") || "SUPER ADMIN"}
                </span>
              </div>
              <i className="bi bi-chevron-down small text-secondary d-none d-md-inline" style={{ fontSize: "0.7rem" }} aria-hidden="true"></i>
            </button>

            {profileOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show mt-2 p-2"
                style={{ minWidth: "230px", zIndex: 1055 }}
              >
                <div className="px-3 py-2 border-bottom mb-1 rounded-top bg-body-tertiary">
                  <p className="mb-0 fw-semibold small text-body text-truncate">
                    {user?.email || "admin@az-ecommerce.local"}
                  </p>
                  <span
                    className={`badge mt-1 ${
                      user?.role === "SUPER_ADMIN"
                        ? "bg-primary-subtle text-primary border border-primary-subtle"
                        : "bg-success-subtle text-success border border-success-subtle"
                    }`}
                    style={{ fontSize: "0.62rem" }}
                  >
                    {user?.role || "Administrator"}
                  </span>
                </div>
                <Link
                  href="/system/users"
                  className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-person-gear text-primary"></i>
                  <span>Admin Accounts</span>
                </Link>
                <Link
                  href="/system/settings"
                  className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-sliders2 text-info"></i>
                  <span>Store Configuration</span>
                </Link>
                <Link
                  href="/system/logs"
                  className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-clock-history text-secondary"></i>
                  <span>Audit Activity Logs</span>
                </Link>
                <div className="dropdown-divider my-1"></div>
                <button
                  type="button"
                  className="dropdown-item rounded-2 py-2 text-danger d-flex align-items-center gap-2 fw-medium"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
