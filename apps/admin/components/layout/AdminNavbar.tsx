"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminLayout } from "./AdminLayoutContext";
import { useAuth } from "@/context/AuthContext";

export function AdminNavbar() {
  const router = useRouter();
  const { toggleSidebar, theme, toggleTheme } = useAdminLayout();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLLIElement>(null);
  const notificationsRef = useRef<HTMLLIElement>(null);

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
              <i className="bi bi-list fs-4"></i>
            </button>
          </li>
          <li className="nav-item d-none d-md-block">
            <Link href="/" className="nav-link text-body-secondary small fw-medium">
              Home
            </Link>
          </li>
          <li className="nav-item d-none d-md-block">
            <Link href="/catalog/categories" className="nav-link text-body-secondary small fw-medium">
              Categories
            </Link>
          </li>
        </ul>

        {/* Global Search Bar */}
        <div className="d-none d-lg-block mx-auto" style={{ maxWidth: "380px", width: "100%" }}>
          <div className="input-group input-group-sm">
            <input
              type="search"
              className="form-control bg-body-tertiary border-secondary-subtle"
              placeholder="Search catalog, orders, customers..."
              aria-label="Global admin search"
            />
            <button className="btn btn-outline-secondary" type="button" aria-label="Search button">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </div>

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
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-expanded={notificationsOpen}
              aria-label="Notifications"
            >
              <i className="bi bi-bell fs-5"></i>
              <span
                className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.65rem", transform: "translate(-85%, 25%)" }}
              >
                3
              </span>
            </button>

            {notificationsOpen && (
              <div
                className="dropdown-menu dropdown-menu-end shadow show mt-2 py-0 border-0"
                style={{ width: "290px", zIndex: 1050 }}
              >
                <div className="p-3 bg-primary text-white rounded-top">
                  <h6 className="mb-0 fw-semibold">Notifications</h6>
                  <small className="opacity-75">3 unread operational alerts</small>
                </div>
                <div className="list-group list-group-flush small">
                  <div className="list-group-item list-group-item-action py-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle-fill text-warning fs-5 me-2"></i>
                      <div>
                        <div className="fw-medium">Low Stock Alert</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          4 items reached reorder threshold
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item list-group-item-action py-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-cart-check-fill text-success fs-5 me-2"></i>
                      <div>
                        <div className="fw-medium">New Order Placed</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          Order #1042 received 5m ago
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="list-group-item list-group-item-action py-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-plus-fill text-info fs-5 me-2"></i>
                      <div>
                        <div className="fw-medium">New Customer Registered</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          customer@example.com
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-center border-top">
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none p-0"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
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
              <i className="bi bi-chevron-down small text-muted d-none d-sm-inline"></i>
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
