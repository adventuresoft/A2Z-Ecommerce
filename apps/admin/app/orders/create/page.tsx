"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreateAdminOrderPayload,
  OrderStatus,
  PaymentStatus,
  ordersService,
} from "../../../services/orders";
import { customersService, CustomerItem } from "../../../services/customers";
import { getProducts, ProductItem, ProductVariantItem } from "../../../services/products";
import { getInventory } from "../../../services/inventory";

interface OrderDraftItem {
  variantId: string;
  productTitle: string;
  sku: string;
  attributesSummary: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  availableStock: number;
  thumbnailUrl?: string | null;
}

export default function CreateOrderPage() {
  const router = useRouter();

  // Mode: existing vs manual
  const [customerMode, setCustomerMode] = useState<"existing" | "manual">("manual");
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Form Fields
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("Dhaka");
  const [shippingState, setShippingState] = useState("Dhaka Division");
  const [shippingPostalCode, setShippingPostalCode] = useState("1212");
  const [customerNotes, setCustomerNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Payment & Status Settings
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("CONFIRMED");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH_ON_DELIVERY" | "CREDIT_CARD" | "MOBILE_BANKING"
  >("CASH_ON_DELIVERY");
  const [paymentRef, setPaymentRef] = useState("");
  const [shippingFee, setShippingFee] = useState<number>(60);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Items in Order
  const [items, setItems] = useState<OrderDraftItem[]>([]);

  // Product & Variant Picker State
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemCustomPrice, setItemCustomPrice] = useState("");

  // Submitting & Alert State
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: "success" | "danger" | "warning";
    text: string;
  } | null>(null);

  // Load initial customer list and catalog
  useEffect(() => {
    async function loadData() {
      setLoadingCustomers(true);
      setLoadingCatalog(true);

      try {
        const [custRes, prodRes, invRes] = await Promise.all([
          customersService.getCustomers({ limit: 50 }).catch(() => ({ items: [] })),
          getProducts({ limit: 100 }).catch(() => ({ items: [] })),
          getInventory({ limit: 150 }).catch(() => ({ items: [] })),
        ]);

        setCustomers(custRes.items || []);
        setCatalogProducts(prodRes.items || []);

        const stockMap: Record<string, number> = {};
        for (const inv of invRes.items || []) {
          stockMap[inv.variantId] = inv.availableQuantity;
        }
        setInventoryMap(stockMap);
      } catch (err: unknown) {
        console.error("Failed to load initial data for order creation:", err);
      } finally {
        setLoadingCustomers(false);
        setLoadingCatalog(false);
      }
    }

    loadData();
  }, []);

  // Handle existing customer selection
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setRecipientName(found.name || "");
      setRecipientPhone(found.phone || "");
      setCustomerEmail(found.email || "");
      if (found.primaryCity) {
        setShippingCity(found.primaryCity);
      }
    }
  };

  // Add Item to Draft
  const handleAddItem = () => {
    if (!selectedVariantId) {
      setAlert({ type: "warning", text: "Please select a product variant first" });
      return;
    }

    // Find the variant across catalog products
    let foundVariant: ProductVariantItem | null = null;
    let foundProduct: ProductItem | null = null;

    for (const prod of catalogProducts) {
      const v = (prod.variants || []).find((varItem) => varItem.id === selectedVariantId);
      if (v) {
        foundVariant = v;
        foundProduct = prod;
        break;
      }
    }

    if (!foundVariant || !foundProduct) {
      setAlert({ type: "danger", text: "Selected product variant not found in catalog" });
      return;
    }

    const availableStock = inventoryMap[foundVariant.id] ?? 99;
    const basePrice =
      foundVariant.salePrice !== null && foundVariant.salePrice !== undefined
        ? Number(foundVariant.salePrice)
        : Number(foundVariant.regularPrice);

    const price = itemCustomPrice !== "" ? parseFloat(itemCustomPrice) : basePrice;

    if (isNaN(price) || price < 0) {
      setAlert({ type: "warning", text: "Please enter a valid price" });
      return;
    }

    const attrSummary = (foundVariant.attributes || [])
      .map((a) => `${a.attributeName}: ${a.value}`)
      .join(", ");

    // Check if already in draft
    const existingIndex = items.findIndex((i) => i.variantId === foundVariant!.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].unitPrice = price;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          variantId: foundVariant.id,
          productTitle: foundProduct.title,
          sku: foundVariant.sku,
          attributesSummary: attrSummary || "Standard",
          unitPrice: price,
          originalPrice: basePrice,
          quantity: itemQuantity,
          availableStock,
          thumbnailUrl: foundVariant.imageUrl || foundProduct.thumbnailUrl,
        },
      ]);
    }

    // Reset picker inputs
    setSelectedVariantId("");
    setItemQuantity(1);
    setItemCustomPrice("");
    setAlert(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    setItems(updated);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const updated = [...items];
    updated[index].unitPrice = newPrice;
    setItems(updated);
  };

  // Totals
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal + (Number(shippingFee) || 0) - (Number(discountAmount) || 0));

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!recipientName.trim()) {
      setAlert({ type: "warning", text: "Recipient Name is required" });
      return;
    }
    if (!recipientPhone.trim()) {
      setAlert({ type: "warning", text: "Recipient Phone number is required" });
      return;
    }
    if (!shippingStreet.trim()) {
      setAlert({ type: "warning", text: "Shipping street address is required" });
      return;
    }
    if (!shippingCity.trim()) {
      setAlert({ type: "warning", text: "Shipping city is required" });
      return;
    }
    if (!shippingPostalCode.trim()) {
      setAlert({ type: "warning", text: "Shipping postal code is required" });
      return;
    }
    if (items.length === 0) {
      setAlert({ type: "warning", text: "Please add at least one product item to the order" });
      return;
    }

    setSubmitting(true);

    const payload: CreateAdminOrderPayload = {
      userId: customerMode === "existing" && selectedCustomerId ? selectedCustomerId : undefined,
      customerEmail: customerEmail.trim() || undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      shippingStreet: shippingStreet.trim(),
      shippingCity: shippingCity.trim(),
      shippingState: shippingState.trim() || undefined,
      shippingPostalCode: shippingPostalCode.trim(),
      shippingFee: Number(shippingFee) || 0,
      discountAmount: Number(discountAmount) || 0,
      orderStatus,
      paymentStatus,
      paymentMethod,
      paymentRef: paymentRef.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
      adminNotes: adminNotes.trim() || undefined,
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice !== i.originalPrice ? i.unitPrice : undefined,
      })),
    };

    try {
      const created = await ordersService.createOrder(payload);
      setAlert({
        type: "success",
        text: `Order ${created.orderNumber} created successfully! Redirecting...`,
      });
      setTimeout(() => {
        router.push(`/orders/${created.id}`);
      }, 1200);
    } catch (err: unknown) {
      setAlert({
        type: "danger",
        text: err instanceof Error ? err.message : "Failed to create order",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-3 py-3">
      {/* Page Header */}
      <div className="row align-items-center mb-3">
        <div className="col-sm-6">
          <h4 className="m-0 fw-semibold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-cart-plus text-primary"></i> Create New Order
          </h4>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small text-muted">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/orders">Orders</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Create Order
              </li>
            </ol>
          </nav>
        </div>
        <div className="col-sm-6 text-sm-end mt-2 mt-sm-0">
          <Link href="/orders" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i> Back to Orders
          </Link>
        </div>
      </div>

      {/* Alert banner */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          <i
            className={`bi ${
              alert.type === "success"
                ? "bi-check-circle-fill"
                : alert.type === "warning"
                ? "bi-exclamation-triangle-fill"
                : "bi-exclamation-circle-fill"
            } me-2`}
          ></i>
          {alert.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Left Column: Customer & Items */}
          <div className="col-lg-8">
            {/* Card 1: Customer Details */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
                <h6 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-person-bounding-box text-primary"></i> Customer & Recipient Information
                </h6>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      customerMode === "manual" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => {
                      setCustomerMode("manual");
                      setSelectedCustomerId("");
                    }}
                  >
                    Direct / New Customer
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      customerMode === "existing" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => setCustomerMode("existing")}
                  >
                    Existing Customer
                  </button>
                </div>
              </div>

              <div className="card-body">
                {customerMode === "existing" && (
                  <div className="mb-3 p-3 bg-light rounded border">
                    <label className="form-label fw-semibold small text-dark mb-1">
                      Select Registered Customer <span className="text-danger">*</span>
                    </label>
                    {loadingCustomers ? (
                      <div className="small text-muted">
                        <span className="spinner-border spinner-border-sm me-1"></span> Loading customers...
                      </div>
                    ) : (
                      <select
                        className="form-select form-select-sm"
                        value={selectedCustomerId}
                        onChange={(e) => handleSelectCustomer(e.target.value)}
                      >
                        <option value="">-- Choose Customer ({customers.length} registered) --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.phone || c.email} ({c.spendingTier || "Customer"})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      Recipient Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Tanvir Hasan"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      Recipient Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. +8801712345678"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Customer Email (Optional)</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="e.g. customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">
                      City / District <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Dhaka"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-8">
                    <label className="form-label small fw-semibold text-dark">
                      Street Address & Details <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. House 45, Road 11, Block E, Banani"
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">
                      Postal Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. 1213"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 mt-2">
                    <label className="form-label small fw-semibold text-dark">Customer Delivery Instructions</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Please call before reaching gate"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Order Items Selection */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
                <h6 className="card-title mb-0 fw-semibold d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-box-seam text-primary"></i> Order Items ({items.length})
                </h6>
                <span className="badge bg-light text-secondary border">Live Catalog Search</span>
              </div>

              <div className="card-body">
                {/* Item Add Row */}
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Select Product & Variant
                      </label>
                      {loadingCatalog ? (
                        <div className="small text-muted py-1">
                          <span className="spinner-border spinner-border-sm me-1"></span> Loading catalog...
                        </div>
                      ) : (
                        <select
                          className="form-select form-select-sm"
                          value={selectedVariantId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedVariantId(val);
                            // Set default custom price input to variant price
                            for (const prod of catalogProducts) {
                              const v = (prod.variants || []).find((varItem) => varItem.id === val);
                              if (v) {
                                setItemCustomPrice(
                                  String(v.salePrice !== null ? v.salePrice : v.regularPrice)
                                );
                                break;
                              }
                            }
                          }}
                        >
                          <option value="">-- Choose Product Variant --</option>
                          {catalogProducts.map((p) => (
                            <optgroup key={p.id} label={p.title}>
                              {(p.variants || []).map((v) => {
                                const stock = inventoryMap[v.id] ?? 0;
                                const price = v.salePrice !== null ? v.salePrice : v.regularPrice;
                                const attrStr = (v.attributes || [])
                                  .map((a) => a.value)
                                  .join(" / ");
                                return (
                                  <option key={v.id} value={v.id}>
                                    {p.title} [{v.sku}] {attrStr ? `(${attrStr})` : ""} — BDT {price} (Stock:{" "}
                                    {stock})
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small fw-semibold text-dark mb-1">Quantity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min={1}
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    <div className="col-md-2">
                      <label className="form-label small fw-semibold text-dark mb-1">
                        Unit Price (BDT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-sm"
                        placeholder="Price"
                        value={itemCustomPrice}
                        onChange={(e) => setItemCustomPrice(e.target.value)}
                      />
                    </div>

                    <div className="col-md-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-100"
                        onClick={handleAddItem}
                        disabled={!selectedVariantId}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Item
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                {items.length === 0 ? (
                  <div className="text-center py-4 text-muted bg-white border border-dashed rounded">
                    <i className="bi bi-bag-x fs-1 text-secondary opacity-50 d-block mb-2"></i>
                    <p className="mb-0 fw-semibold">No items added to this order yet</p>
                    <small className="text-secondary">
                      Use the selection box above to search catalog products and add variants.
                    </small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered align-middle mb-0 small">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th>Product & Variant</th>
                          <th>SKU</th>
                          <th className="text-center" style={{ width: "130px" }}>
                            Unit Price (BDT)
                          </th>
                          <th className="text-center" style={{ width: "110px" }}>
                            Qty
                          </th>
                          <th className="text-end" style={{ width: "120px" }}>
                            Line Total
                          </th>
                          <th className="text-center" style={{ width: "50px" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <tr key={item.variantId}>
                            <td>
                              <div className="fw-semibold text-dark">{item.productTitle}</div>
                              <div className="text-muted small">
                                <span className="badge bg-secondary-subtle text-secondary-emphasis me-1">
                                  {item.attributesSummary}
                                </span>
                                {item.availableStock <= 5 ? (
                                  <span className="badge bg-warning-subtle text-warning-emphasis">
                                    Low Stock: {item.availableStock}
                                  </span>
                                ) : (
                                  <span className="badge bg-success-subtle text-success-emphasis">
                                    Stock: {item.availableStock}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <code>{item.sku}</code>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control form-control-sm text-end"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <div className="input-group input-group-sm">
                                <button
                                  className="btn btn-outline-secondary px-2"
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  className="form-control text-center px-1"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdateItemQuantity(idx, parseInt(e.target.value) || 1)
                                  }
                                />
                                <button
                                  className="btn btn-outline-secondary px-2"
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="text-end fw-bold text-dark">
                              BDT {(item.unitPrice * item.quantity).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm p-1"
                                title="Remove item"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Internal Admin Notes */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 fw-semibold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-journal-text text-secondary"></i> Internal Administrator Notes
                </h6>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="e.g. Phone order received by customer support. Verified address via call."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                ></textarea>
                <small className="text-muted mt-1 d-block">
                  These notes are for internal operational use and will be stored in the order history log.
                </small>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Settings & Submit */}
          <div className="col-lg-4">
            {/* Order Settings Card */}
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 fw-semibold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-sliders text-primary"></i> Order & Payment Settings
                </h6>
              </div>

              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Initial Order Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  >
                    <option value="CONFIRMED">CONFIRMED (Ready for processing)</option>
                    <option value="PENDING">PENDING (Awaiting confirmation)</option>
                    <option value="PROCESSING">PROCESSING (In packaging)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Payment Method</label>
                  <select
                    className="form-select form-select-sm"
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "CASH_ON_DELIVERY" | "CREDIT_CARD" | "MOBILE_BANKING"
                      )
                    }
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Delivery (COD)</option>
                    <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad/Rocket)</option>
                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Payment Status</label>
                  <select
                    className="form-select form-select-sm"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  >
                    <option value="PENDING">PENDING (Unpaid / Collect on Delivery)</option>
                    <option value="PAID">PAID (Already Collected / Verified)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Payment Reference / Txn ID</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. TXN-893421 or COD"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>

                <hr className="my-3" />

                <div className="mb-2">
                  <label className="form-label small fw-semibold text-dark">Shipping Delivery Fee (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Manual Discount Amount (BDT)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control form-control-sm"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="card shadow-sm border-0 mb-3 border-top border-primary border-3">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 fw-semibold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-receipt text-success"></i> Financial Summary
                </h6>
              </div>

              <div className="card-body">
                <div className="d-flex justify-content-between mb-2 small text-secondary">
                  <span>Items Subtotal:</span>
                  <span className="fw-semibold text-dark">
                    BDT{" "}
                    {subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-2 small text-secondary">
                  <span>Shipping Fee:</span>
                  <span className="fw-semibold text-dark">
                    + BDT{" "}
                    {Number(shippingFee || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-2 small text-secondary">
                  <span>Discount Applied:</span>
                  <span className="fw-semibold text-danger">
                    - BDT{" "}
                    {Number(discountAmount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <hr className="my-2" />

                <div className="d-flex justify-content-between align-items-center py-2 mb-3 bg-light px-2 rounded">
                  <span className="fw-bold text-dark fs-6">Grand Total:</span>
                  <span className="fw-bold text-primary fs-5">
                    BDT{" "}
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting || items.length === 0}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Creating Order...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle fs-5"></i>
                      Confirm & Place Order
                    </>
                  )}
                </button>

                <Link href="/orders" className="btn btn-outline-secondary btn-sm w-100 mt-2">
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
