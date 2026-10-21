export interface NavItem {
  id: string;
  title: string;
  href?: string;
  icon?: string;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark";
  };
  children?: NavItem[];
  phase?: number;
  isHeader?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  href?: string;
  active?: boolean;
}

export const navigationConfig: NavItem[] = [
  {
    id: "nav-main-header",
    title: "MAIN NAVIGATION",
    isHeader: true,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/",
    icon: "bi bi-speedometer2",
    phase: 1,
  },
  {
    id: "products",
    title: "Products",
    icon: "bi bi-box-seam",
    phase: 1,
    children: [
      {
        id: "products-categories",
        title: "Categories",
        href: "/catalog/categories",
        icon: "bi bi-tags",
        phase: 1,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "products-all",
        title: "All Products",
        href: "/catalog/products",
        icon: "bi bi-grid-3x3-gap",
        phase: 2,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "products-brands",
        title: "Brands",
        href: "/catalog/brands",
        icon: "bi bi-award",
        phase: 1,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "products-attributes",
        title: "Attributes",
        href: "/catalog/attributes",
        icon: "bi bi-sliders",
        phase: 1,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "products-variants",
        title: "Variants",
        href: "/catalog/variants",
        icon: "bi bi-diagram-3",
        phase: 2,
        badge: { text: "Live", variant: "success" },
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    icon: "bi bi-cart3",
    phase: 3,
    children: [
      {
        id: "orders-list",
        title: "All Orders",
        href: "/orders",
        icon: "bi bi-receipt",
        phase: 3,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "orders-returns",
        title: "Returns",
        href: "/orders/returns",
        icon: "bi bi-arrow-return-left",
        phase: 3,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: "bi bi-boxes",
    phase: 3,
    children: [
      {
        id: "inventory-overview",
        title: "Stock Overview",
        href: "/inventory",
        icon: "bi bi-layers",
        phase: 3,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "inventory-adjustments",
        title: "Adjustments",
        href: "/inventory/adjustments",
        icon: "bi bi-pencil-square",
        phase: 3,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "inventory-movements",
        title: "Movements",
        href: "/inventory/movements",
        icon: "bi bi-arrow-left-right",
        phase: 3,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "inventory-low-stock",
        title: "Low Stock Alerts",
        href: "/inventory/low-stock",
        icon: "bi bi-exclamation-triangle",
        phase: 3,
        badge: { text: "Live", variant: "success" },
      },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    icon: "bi bi-people",
    phase: 3,
    children: [
      {
        id: "customers-list",
        title: "All Customers",
        href: "/customers",
        icon: "bi bi-person-lines-fill",
        phase: 3,
      },
      {
        id: "customers-groups",
        title: "Customer Groups",
        href: "/customers/groups",
        icon: "bi bi-collection",
        phase: 3,
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: "bi bi-megaphone",
    phase: 4,
    children: [
      {
        id: "marketing-coupons",
        title: "Coupons",
        href: "/marketing/coupons",
        icon: "bi bi-ticket-perforated",
        phase: 4,
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: "bi bi-credit-card",
    phase: 4,
    children: [
      {
        id: "payments-transactions",
        title: "Transactions",
        href: "/payments/transactions",
        icon: "bi bi-cash-stack",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "payments-refunds",
        title: "Refunds",
        href: "/payments/refunds",
        icon: "bi bi-arrow-counterclockwise",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    icon: "bi bi-truck",
    phase: 4,
    children: [
      {
        id: "shipping-shipments",
        title: "Shipments",
        href: "/shipping/shipments",
        icon: "bi bi-box",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "shipping-methods",
        title: "Shipping Methods",
        href: "/shipping/methods",
        icon: "bi bi-gear-wide",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "shipping-zones",
        title: "Shipping Zones",
        href: "/shipping/zones",
        icon: "bi bi-geo-alt",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
    ],
  },
  {
    id: "engagement",
    title: "Engagement",
    icon: "bi bi-chat-square-quote",
    phase: 4,
    children: [
      {
        id: "engagement-reviews",
        title: "Product Reviews",
        href: "/engagement/reviews",
        icon: "bi bi-star",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "engagement-notifications",
        title: "Notifications",
        href: "/engagement/notifications",
        icon: "bi bi-bell",
        phase: 4,
        badge: { text: "Live", variant: "success" },
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: "bi bi-graph-up-arrow",
    phase: 5,
    children: [
      {
        id: "reports-sales",
        title: "Sales Report",
        href: "/reports/sales",
        icon: "bi bi-currency-dollar",
        phase: 5,
      },
      {
        id: "reports-orders",
        title: "Orders Report",
        href: "/reports/orders",
        icon: "bi bi-bar-chart",
        phase: 5,
      },
      {
        id: "reports-inventory",
        title: "Inventory Report",
        href: "/reports/inventory",
        icon: "bi bi-pie-chart",
        phase: 5,
      },
      {
        id: "reports-customers",
        title: "Customer Report",
        href: "/reports/customers",
        icon: "bi bi-person-check",
        phase: 5,
      },
    ],
  },
  {
    id: "nav-system-header",
    title: "SYSTEM & SETTINGS",
    isHeader: true,
  },
  {
    id: "system",
    title: "System",
    icon: "bi bi-gear",
    phase: 1,
    children: [
      {
        id: "system-users",
        title: "Admin Users",
        href: "/system/users",
        icon: "bi bi-shield-lock",
        phase: 1,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "system-settings",
        title: "Store Settings",
        href: "/system/settings",
        icon: "bi bi-sliders2",
        phase: 2,
        badge: { text: "Live", variant: "success" },
      },
      {
        id: "system-logs",
        title: "Activity Logs",
        href: "/system/logs",
        icon: "bi bi-clock-history",
        phase: 3,
      },
    ],
  },
];

/**
 * Searches the navigation tree for a matching item or child item based on the current pathname.
 */
export function findActiveItem(
  pathname: string,
  items: NavItem[] = navigationConfig
): { activeItem: NavItem | null; parentItem: NavItem | null } {
  // Normalize pathname (remove trailing slash unless root)
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  for (const item of items) {
    if (item.href) {
      const itemHref = item.href.length > 1 && item.href.endsWith("/") ? item.href.slice(0, -1) : item.href;
      if (itemHref === normalized) {
        return { activeItem: item, parentItem: null };
      }
    }

    if (item.children) {
      for (const child of item.children) {
        if (child.href) {
          const childHref = child.href.length > 1 && child.href.endsWith("/") ? child.href.slice(0, -1) : child.href;
          if (childHref === normalized || normalized.startsWith(childHref + "/")) {
            return { activeItem: child, parentItem: item };
          }
        }
      }
    }
  }

  return { activeItem: null, parentItem: null };
}

/**
 * Derives a breadcrumb list from the current URL path.
 */
export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (normalized === "" || normalized === "/") {
    return [{ title: "Dashboard", href: "/", active: true }];
  }

  const { activeItem, parentItem } = findActiveItem(normalized);

  const breadcrumbs: BreadcrumbItem[] = [{ title: "Home", href: "/" }];

  if (parentItem) {
    breadcrumbs.push({
      title: parentItem.title,
      href: parentItem.href,
      active: false,
    });
  }

  if (activeItem) {
    breadcrumbs.push({
      title: activeItem.title,
      href: activeItem.href,
      active: true,
    });
  } else {
    // Fallback: build from path segments if route is dynamic or unlisted
    const segments = normalized.split("/").filter(Boolean);
    let currentPath = "";

    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const formattedTitle = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");

      breadcrumbs.push({
        title: formattedTitle,
        href: isLast ? undefined : currentPath,
        active: isLast,
      });
    });
  }

  return breadcrumbs;
}
