"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

export type AdminTheme = "light" | "dark";

interface AdminLayoutContextValue {
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  theme: AdminTheme;
  toggleSidebar: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | undefined>(undefined);

const SIDEBAR_COLLAPSE_KEY = "az_admin_sidebar_collapsed";
const THEME_KEY = "az_admin_theme";

// External store for desktop sidebar collapse state
let currentSidebarCollapsed = false;
if (typeof window !== "undefined") {
  try {
    currentSidebarCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true";
  } catch {
    // Ignore restricted localStorage
  }
}

const collapseListeners = new Set<() => void>();

function setStoredCollapse(value: boolean) {
  currentSidebarCollapsed = value;
  try {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(value));
  } catch {
    // Ignore restricted localStorage
  }
  collapseListeners.forEach((listener) => listener());
}

function subscribeCollapse(listener: () => void) {
  collapseListeners.add(listener);
  return () => {
    collapseListeners.delete(listener);
  };
}

function getCollapseSnapshot(): boolean {
  return currentSidebarCollapsed;
}

function getCollapseServerSnapshot(): boolean {
  return false;
}

// External store for theme (light / dark)
let currentTheme: AdminTheme = "light";
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      currentTheme = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      currentTheme = "dark";
    }
  } catch {
    // Ignore restricted localStorage
  }
}

const themeListeners = new Set<() => void>();

function setStoredTheme(value: AdminTheme) {
  currentTheme = value;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // Ignore restricted localStorage
  }
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-bs-theme", value);
  }
  themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

function getThemeSnapshot(): AdminTheme {
  return currentTheme;
}

function getThemeServerSnapshot(): AdminTheme {
  return "light";
}

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useSyncExternalStore(subscribeCollapse, getCollapseSnapshot, getCollapseServerSnapshot);
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Reset mobile drawer during render when route changes
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Sync state to body classes and root attribute
  useEffect(() => {
    const body = document.body;
    if (sidebarCollapsed) {
      body.classList.add("sidebar-collapse");
    } else {
      body.classList.remove("sidebar-collapse");
    }

    if (mobileOpen) {
      body.classList.add("sidebar-open");
    } else {
      body.classList.remove("sidebar-open");
    }

    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [sidebarCollapsed, mobileOpen, theme]);

  // Handle window resize & Escape key
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setMobileOpen((prev) => !prev);
    } else {
      setStoredCollapse(!currentSidebarCollapsed);
    }
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setStoredCollapse(collapsed);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: AdminTheme = currentTheme === "dark" ? "light" : "dark";
    setStoredTheme(nextTheme);
  }, []);

  const setTheme = useCallback((newTheme: AdminTheme) => {
    setStoredTheme(newTheme);
  }, []);

  return (
    <AdminLayoutContext.Provider
      value={{
        sidebarCollapsed,
        mobileOpen,
        theme,
        toggleSidebar,
        closeMobileSidebar,
        openMobileSidebar,
        setSidebarCollapsed,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout(): AdminLayoutContextValue {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error("useAdminLayout must be used within an AdminLayoutProvider");
  }
  return context;
}
