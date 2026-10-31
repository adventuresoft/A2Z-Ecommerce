"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "@/context/AuthContext";

import { engagementService, AdminNotification } from "@/services/engagement";

export function AdminNavbar() {
  const { toggleSidebar, theme, toggleTheme } = useAdminLayout();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([]);
  const profileRef = useRef<HTMLLIElement>(null);
  const notificationsRef = useRef<HTMLLIElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
    <nav className="app-header navbar navbar-expand bg-body shadow-sm px-3 sticky-top">
      <div className="container-fluid p-0">
        {/* Left Navbar links */}
        <ul className="navbar-nav align-items-center gap-2">
          <li className="nav-item">
            <button
              type="button"
              className="nav-link btn btn-link text-body p-1"
              onClick={toggleSidebar}
              aria-label="Toggle navigation sidebar"
              title="Toggle sidebar"
            >
              <i className="bi bi-list fs-4" aria-hidden="true"></i>
            </button>
          </li>
        </ul>

        {/* Right Navbar links */}
        <ul className="navbar-nav ms-auto align-items-center gap-1">
          {/* Theme Toggle (Light / Dark Mode) */}
          <li className="nav-item">
            <button
              type="button"
              className="nav-link btn btn-link text-body p-2 d-flex align-items-center justify-content-center"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <i className="bi bi-sun-fill fs-5 text-warning" aria-hidden="true"></i>
              ) : (
                <i className="bi bi-moon-stars-fill fs-5 text-secondary" aria-hidden="true"></i>
              )}
            </button>
          </li>

          {/* Notifications Dropdown */}
          <li className="nav-item dropdown position-relative" ref={notificationsRef}>
            <button
              type="button"
              className="nav-link btn btn-link text-body p-2 position-relative"
              onClick={() => {
                setNotificationsOpen((prev) => !prev);
                loadNotifications();
              }}
              aria-expanded={notificationsOpen}
              aria-haspopup="true"
              aria-label="Notifications"
            >
              <i className="bi bi-bell fs-5" aria-hidden="true"></i>
              {unreadCount > 0 && (
                <span
                  className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger tabular-nums"
                  style={{ fontSize: "0.65rem", transform: "translate(-85%, 25%)" }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="dropdown-menu dropdown-menu-end shadow show mt-2 py-0 border-0"
                style={{ width: "320px", zIndex: 1050 }}
              >
                <div className="p-3 bg-primary text-white rounded-top d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0 fw-semibold">Notifications</h6>
                    <small className="opacity-75">{unreadCount} unread alert{unreadCount === 1 ? "" : "s"}</small>
                  </div>
                  <Link
                    href="/engagement/notifications"
                    className="btn btn-sm btn-light py-0 px-2 small text-primary fw-medium"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    View All
                  </Link>
                </div>
                <div className="list-group list-group-flush small" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {recentNotifications.length === 0 ? (
                    <div className="p-3 text-center text-muted">
                      No notifications found
                    </div>
                  ) : (
                    recentNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        href={notif.linkUrl || "/engagement/notifications"}
                        className={`list-group-item list-group-item-action py-2 ${
                          notif.isRead ? "" : "bg-light"
                        }`}
                        onClick={() => {
                          if (!notif.isRead) {
                            engagementService.markNotificationAsRead(notif.id).catch(() => {});
                          }
                          setNotificationsOpen(false);
                        }}
                      >
                        <div className="d-flex align-items-start">
                          <i className={`${getNotifIcon(notif.type)} fs-5 me-2 mt-1`}></i>
                          <div className="overflow-hidden w-100">
                            <div className="d-flex justify-content-between align-items-baseline">
                              <span className="fw-medium text-dark text-truncate" style={{ maxWidth: "180px" }}>
                                {notif.title}
                              </span>
                              {!notif.isRead && (
                                <span className="badge rounded-pill bg-primary" style={{ fontSize: "0.55rem" }}>
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-muted text-truncate" style={{ fontSize: "0.75rem" }}>
                              {notif.message}
                            </div>
                            <div className="text-muted text-end mt-1" style={{ fontSize: "0.65rem" }}>
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="p-2 text-center border-top bg-light rounded-bottom">
                  <Link
                    href="/engagement/notifications"
                    className="text-decoration-none small text-primary fw-semibold"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Notification Center <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            )}
          </li>

          {/* User Profile Menu */}
          <li className="nav-item dropdown position-relative ms-1" ref={profileRef}>
            <button
              type="button"
              className="nav-link btn btn-link text-body d-flex align-items-center gap-2 p-1 text-decoration-none"
              onClick={() => setProfileOpen((prev) => !prev)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="User profile menu"
            >
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-semibold shadow-sm"
                style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}
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
              <div className="d-none d-sm-block text-start" style={{ lineHeight: "1.2" }}>
                <span className="d-block fw-semibold small text-body">{user?.name || "Administrator"}</span>
                <span
                  className={`badge ${
                    user?.role === "SUPER_ADMIN"
                      ? "bg-primary-subtle text-primary border border-primary-subtle"
                      : user?.role === "ADMIN"
                      ? "bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                      : "bg-success-subtle text-success border border-success-subtle"
                  }`}
                  style={{ fontSize: "0.65rem" }}
                >
                  {user?.role || "GUEST"}
                </span>
              </div>
              <i className="bi bi-chevron-down small text-muted d-none d-sm-inline" aria-hidden="true"></i>
            </button>

            {profileOpen && (
              <div
                className="dropdown-menu dropdown-menu-end shadow show mt-2 py-2 border-0"
                style={{ minWidth: "210px", zIndex: 1050 }}
              >
                <div className="px-3 py-2 border-bottom mb-1">
                  <p className="mb-0 fw-semibold small text-body">{user?.email || "admin@az-ecommerce.local"}</p>
                  <span className="text-muted small">Role: {user?.role || "Administrator"}</span>
                </div>
                <Link
                  href="/system/users"
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-person-gear text-secondary"></i>
                  <span>Profile Settings</span>
                </Link>
                <Link
                  href="/system/settings"
                  className="dropdown-item py-2 d-flex align-items-center gap-2"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="bi bi-sliders2 text-secondary"></i>
                  <span>Store Preferences</span>
                </Link>
                <div className="dropdown-divider my-1"></div>
                <button
                  type="button"
                  className="dropdown-item py-2 text-danger d-flex align-items-center gap-2"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
