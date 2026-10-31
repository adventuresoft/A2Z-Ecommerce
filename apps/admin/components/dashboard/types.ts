export type TimeRange = 'today' | '7d' | '30d' | '90d' | 'year';

export interface DashboardKpiData {
  grossSales: number;
  netSales: number;
  salesGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCustomers: number;
  newCustomers: number;
  averageOrderValue: number;
  currency: string;
}

export interface TimelinePoint {
  date: string;
  label: string;
  grossSales: number;
  netSales: number;
  orderCount: number;
  itemsSold: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  revenue: number;
  ordersCount: number;
  percentage: number;
  color: string;
}

export interface PaymentBreakdown {
  method: string;
  label: string;
  ordersCount: number;
  revenue: number;
  percentage: number;
  color: string;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  createdAt: string;
}

export interface InventoryAlertSummary {
  id: string;
  productTitle: string;
  sku: string;
  categoryName?: string;
  quantity: number;
  threshold: number;
  isOutOfStock: boolean;
  isLowStock: boolean;
}

export interface TopProductSummary {
  id: string;
  title: string;
  categoryName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}
