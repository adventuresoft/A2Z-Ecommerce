"use client";

import React, { useState, useEffect } from "react";
import { AdminOrder } from "../../services/orders";
import { taxesApi, TaxClassItem } from "../../services/taxes";
import { useAuth } from "../../context/AuthContext";

export type PrintMode = "invoice" | "address" | "shipment";

interface OrderPrintModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: PrintMode;
}

export function OrderPrintModal({
  order,
  isOpen,
  onClose,
  initialMode = "invoice",
}: OrderPrintModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PrintMode>(initialMode);
  const [isPrinting, setIsPrinting] = useState(false);
  const [defaultTaxClass, setDefaultTaxClass] = useState<TaxClassItem | null>(null);

  const preparerName = user?.name || "Sales Administrator";
  const roleTitle =
    (user as any)?.designation ||
    (user?.role === "SUPER_ADMIN"
      ? "Super Administrator"
      : user?.role === "SHOP_MANAGER"
      ? "Sales Administrator"
      : user?.role === "ADMIN"
      ? "Sales Administrator"
      : "Sales Administrator");
  const preparerDesignation = `${roleTitle}, A to Z Ecommerce`;

  // Load configured tax classes from system/taxes
  useEffect(() => {
    let isMounted = true;
    async function loadSystemTaxes() {
      try {
        const res = await taxesApi.getTaxes({ isActive: true, limit: 20 });
        if (isMounted && res.items && res.items.length > 0) {
          const defaultTax = res.items.find((t) => t.isDefault) || res.items[0];
          setDefaultTaxClass(defaultTax);
        }
      } catch (err) {
        console.warn("Failed to fetch system taxes for print modal:", err);
      }
    }
    loadSystemTaxes();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("az-printable-area");
    if (!printContent) {
      window.print();
      return;
    }

    setIsPrinting(true);

    try {
      let iframe = document.getElementById("az-print-iframe") as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "az-print-iframe";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        setIsPrinting(false);
        window.print();
        return;
      }

      const docTitle =
        activeTab === "invoice"
          ? `Invoice_${order.orderNumber}`
          : activeTab === "address"
          ? `DeliveryLabel_${order.orderNumber}`
          : `Shipment_${order.orderNumber}`;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${docTitle}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" />
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.2/font/bootstrap-icons.min.css" />
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 13px;
              line-height: 1.45;
            }
            .table-bordered th, .table-bordered td {
              border: 1px solid #cbd5e1 !important;
            }
            .bg-light {
              background-color: #f8fafc !important;
            }
            .border {
              border-color: #cbd5e1 !important;
            }
            .border-bottom {
              border-bottom-color: #cbd5e1 !important;
            }
            .border-top {
              border-top-color: #cbd5e1 !important;
            }
            .badge {
              border: 1px solid rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 100%;">
            ${printContent.innerHTML}
          </div>
        </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (printErr) {
          console.error("Iframe print error, falling back to window.print():", printErr);
          window.print();
        } finally {
          setIsPrinting(false);
        }
      }, 350);
    } catch (err) {
      console.error("Print initialization failed:", err);
      setIsPrinting(false);
      window.print();
    }
  };

  const getPaymentMethodDisplay = (order: AdminOrder) => {
    const rawMethod =
      order.paymentMethod ||
      (order.payments && order.payments.length > 0 ? order.payments[0].method : "CASH_ON_DELIVERY");

    switch (rawMethod) {
      case "PAYSTATION":
        return { name: "PayStation Online Gateway", channel: "Visa / Mastercard / MFS", isOnline: true };
      case "CASH_ON_DELIVERY":
        return { name: "Cash on Delivery (COD)", channel: "Doorstep Cash Collection", isOnline: false };
      case "MOBILE_BANKING":
        return { name: "Mobile Banking (bKash / Nagad)", channel: "Direct Wallet Transfer", isOnline: true };
      case "BANK_TRANSFER":
        return { name: "Direct Bank Transfer", channel: "Corporate Wire / Deposit", isOnline: true };
      case "CHECK_PAYMENT":
        return { name: "Cheque Payment", channel: "Bank Clearing Slip", isOnline: false };
      case "CREDIT_CARD":
        return { name: "Credit / Debit Card", channel: "Card POS / Gateway", isOnline: true };
      default:
        return { name: rawMethod.replace(/_/g, " "), channel: "Standard Payment", isOnline: false };
    }
  };

  const paymentInfo = getPaymentMethodDisplay(order);
  const primaryPayment = order.payments?.[0];
  const primaryShipment = order.shipments?.[0];

  // Financial calculations with dynamic Tax percentage & Shipping
  const subtotal = Number(order.subtotal) || 0;
  const discountAmount = Number(order.discountAmount) || 0;
  const shippingFee = Number(order.shippingFee) || 0;
  const recordedTax = Number(order.totalTaxAmount) || 0;

  // Priority Tax Resolution from system/taxes and order data
  // 1. Check if order items specify tax rate/class
  const itemWithTax = order.items.find((i) => i.taxRate !== undefined && i.taxRate > 0);
  const itemTaxRate = itemWithTax?.taxRate;
  const itemTaxClassName = itemWithTax?.taxClassName;

  // 2. Default Tax rate from admin system/taxes (displayed simply as VAT)
  let taxLabel = "VAT";
  let taxRatePercent = defaultTaxClass ? Number(defaultTaxClass.rate) : 15;
  let effectiveTaxAmount = recordedTax;

  if (itemTaxClassName) {
    taxLabel = "VAT";
  }

  if (recordedTax > 0 && subtotal > 0) {
    if (itemTaxRate !== undefined && itemTaxRate > 0) {
      taxRatePercent = itemTaxRate;
    } else {
      taxRatePercent = Math.round((recordedTax / subtotal) * 100);
    }
    effectiveTaxAmount = recordedTax;
  } else if (recordedTax === 0 && subtotal > 0) {
    // If tax wasn't pre-recorded, apply configured system/taxes default rate
    if (itemTaxRate !== undefined && itemTaxRate > 0) {
      taxRatePercent = itemTaxRate;
      effectiveTaxAmount = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
    } else if (defaultTaxClass) {
      taxRatePercent = Number(defaultTaxClass.rate);
      effectiveTaxAmount = Number(((subtotal * taxRatePercent) / 100).toFixed(2));
    } else {
      taxRatePercent = 15;
      effectiveTaxAmount = Number((subtotal * 0.15).toFixed(2));
    }
  }

  // Grand total calculation: Subtotal - Discount + Shipping + Tax
  const computedGrandTotal = Number(
    Math.max(0, subtotal - discountAmount + shippingFee + effectiveTaxAmount).toFixed(2)
  );

  const orderDateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedAddress = [
    order.shippingStreet,
    order.shippingThana,
    order.shippingCity,
    order.shippingState && order.shippingState !== order.shippingCity ? order.shippingState : null,
    order.shippingPostalCode ? `Postal Code: ${order.shippingPostalCode}` : null,
    "Bangladesh",
  ]
    .filter(Boolean)
    .join(", ");

  const renderDynamicPaymentDetails = () => {
    const rawMethod =
      order.paymentMethod ||
      (order.payments && order.payments.length > 0 ? order.payments[0].method : "CASH_ON_DELIVERY");
    const payment = order.payments?.[0];
    const statusText = order.paymentStatus || payment?.status || "PENDING";
    const isPaid = statusText === "PAID";

    if (rawMethod === "CASH_ON_DELIVERY") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">Cash on Delivery (COD)</strong></div>
          <div>Settlement: <span className="text-dark">Doorstep Cash Collection</span></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {!isPaid && (
            <div>Collect Amount: <strong className="text-dark font-monospace">৳{computedGrandTotal.toFixed(2)}</strong></div>
          )}
        </div>
      );
    }

    if (rawMethod === "PAYSTATION") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">PayStation Online Gateway</strong></div>
          <div>Channel: <span className="text-dark">Cards / Mobile Banking / Net Banking</span></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {payment?.transactionRef && (
            <div>Trx ID: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
          )}
          {payment?.paidAt && (
            <div>Paid On: <span className="text-dark">{new Date(payment.paidAt).toLocaleDateString("en-GB")}</span></div>
          )}
        </div>
      );
    }

    if (rawMethod === "MOBILE_BANKING") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">Mobile Banking (bKash / Nagad / Rocket)</strong></div>
          <div>Channel: <span className="text-dark">Direct Wallet Payment</span></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {payment?.transactionRef && (
            <div>Trx ID: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
          )}
          <div>Amount: <strong className="text-dark font-monospace">৳{(payment?.amount ?? computedGrandTotal).toFixed(2)}</strong></div>
        </div>
      );
    }

    if (rawMethod === "BANK_TRANSFER") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">Direct Bank Transfer</strong></div>
          <div>Beneficiary Bank: <strong className="text-dark">Borcelle Bank PLC</strong></div>
          <div>Account Name: <span className="text-dark">A TO Z ECOMMERCE LTD.</span></div>
          <div>Account Number: <strong className="text-dark font-monospace">10294482990101</strong></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {payment?.transactionRef && (
            <div>Deposit Ref: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
          )}
        </div>
      );
    }

    if (rawMethod === "CREDIT_CARD") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">Credit / Debit Card</strong></div>
          <div>Channel: <span className="text-dark">Card POS / Payment Gateway</span></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {payment?.transactionRef && (
            <div>Auth / Trx ID: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
          )}
        </div>
      );
    }

    if (rawMethod === "CHECK_PAYMENT") {
      return (
        <div className="text-secondary" style={{ lineHeight: "1.6" }}>
          <div>Method: <strong className="text-dark">Cheque Payment</strong></div>
          <div>Channel: <span className="text-dark">Bank Clearing Slip</span></div>
          <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
          {payment?.transactionRef && (
            <div>Cheque / Slip Ref: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
          )}
        </div>
      );
    }

    // Default / Generic Method Fallback
    return (
      <div className="text-secondary" style={{ lineHeight: "1.6" }}>
        <div>Method: <strong className="text-dark">{paymentInfo.name}</strong></div>
        <div>Channel: <span className="text-dark">{paymentInfo.channel}</span></div>
        <div>Payment Status: <span className={`fw-bold ${isPaid ? "text-success" : "text-dark"}`}>{statusText}</span></div>
        {payment?.transactionRef && (
          <div>Trx Ref: <strong className="text-dark font-monospace">{payment.transactionRef}</strong></div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Comprehensive Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          /* Hide non-printable admin UI elements */
          aside, nav, header, footer, .app-header, .app-sidebar, .app-footer, .no-print, .modal-backdrop {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .modal {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
            background: none !important;
            border-radius: 0 !important;
          }
          .modal-body {
            padding: 0 !important;
            background: none !important;
            overflow: visible !important;
          }
          #az-printable-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}} />

      {/* Modal Dialog */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1060 }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
            {/* Modal Header with Tabs and Controls */}
            <div className="modal-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3 no-print">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center"
                  style={{ width: 38, height: 38 }}
                >
                  <i className="bi bi-printer-fill fs-5"></i>
                </div>
                <div>
                  <h6 className="modal-title fw-bold text-dark mb-0">
                    Order Document Print Suite
                  </h6>
                  <span className="small text-muted font-monospace">
                    Order: #{order.orderNumber}
                  </span>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="btn-group p-1 bg-light rounded-3 border" role="group">
                <button
                  type="button"
                  className={`btn btn-sm px-3 fw-semibold rounded-2 ${
                    activeTab === "invoice"
                      ? "btn-white bg-white text-primary shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  onClick={() => setActiveTab("invoice")}
                >
                  <i className="bi bi-receipt me-1.5"></i> Order Invoice
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 fw-semibold rounded-2 ${
                    activeTab === "address"
                      ? "btn-white bg-white text-primary shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  onClick={() => setActiveTab("address")}
                >
                  <i className="bi bi-geo-alt me-1.5"></i> Delivery Address &amp; Label
                </button>
                <button
                  type="button"
                  className={`btn btn-sm px-3 fw-semibold rounded-2 ${
                    activeTab === "shipment"
                      ? "btn-white bg-white text-primary shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  onClick={() => setActiveTab("shipment")}
                >
                  <i className="bi bi-truck me-1.5"></i> Shipments Manifest
                </button>
              </div>

              {/* Action Buttons */}
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  disabled={isPrinting}
                  className="btn btn-primary px-3 fw-bold d-flex align-items-center gap-2 shadow-sm"
                  onClick={handlePrint}
                >
                  {isPrinting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Preparing Print…</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-printer"></i>
                      <span>Print Document</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                ></button>
              </div>
            </div>

            {/* Modal Body / Paper Sheet Preview Canvas */}
            <div
              className="modal-body p-4 bg-slate-100"
              style={{ backgroundColor: "#f8fafc", minHeight: "75vh" }}
            >
              <div className="d-flex justify-content-center">
                {/* A4 Paper Document Preview Container */}
                <div
                  id="az-printable-area"
                  className="bg-white rounded-3 p-5 shadow-sm border"
                  style={{
                    width: "100%",
                    maxWidth: "820px",
                    color: "#0f172a",
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  }}
                >
                  {/* TAB 1: ORDER INVOICE */}
                  {activeTab === "invoice" && (
                    <div className="order-invoice-content position-relative" style={{ minHeight: "920px", display: "flex", flexDirection: "column" }}>
                      {/* Top Header */}
                      <div className="mb-4">
                        <h1
                          className="text-dark fw-black mb-2"
                          style={{
                            fontSize: "36px",
                            fontWeight: 900,
                            letterSpacing: "-0.5px",
                            lineHeight: 1,
                            textTransform: "uppercase",
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                        >
                          INVOICE
                        </h1>
                        <div className="text-secondary small" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                          <div>
                            Invoice Number: <span className="fw-semibold text-dark">#{order.orderNumber}</span>
                          </div>
                          <div>
                            Invoice Date: <span className="fw-semibold text-dark">{orderDateStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* 2-Column: Sender (STUDIO / STORE) and Recipient (BILL TO) */}
                      <div className="row mb-4" style={{ fontSize: "12.5px", lineHeight: "1.55" }}>
                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
                            A TO Z ECOMMERCE
                          </div>
                          <div className="text-secondary">
                            House 42, Road 11, Sector 4, Banani, Dhaka-1213
                            <br />
                            +880 1700-000000
                            <br />
                            support@a2z-ecommerce.com
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
                            BILL TO
                          </div>
                          <div className="text-dark fw-semibold">{order.recipientName}</div>
                          <div className="text-secondary">
                            {formattedAddress}
                            <br />
                            {order.recipientPhone}
                            {order.customerEmail && (
                              <>
                                <br />
                                {order.customerEmail}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="mb-4">
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1.5px solid #18181b",
                            fontSize: "12.5px",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#ffffff", borderBottom: "1.5px solid #18181b" }}>
                              <th
                                style={{
                                  padding: "10px 14px",
                                  textAlign: "left",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  borderRight: "1px solid #18181b",
                                  width: "52%",
                                }}
                              >
                                Item &amp; Description
                              </th>
                              <th
                                style={{
                                  padding: "10px 14px",
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  borderRight: "1px solid #18181b",
                                  width: "16%",
                                }}
                              >
                                Unit Price
                              </th>
                              <th
                                style={{
                                  padding: "10px 14px",
                                  textAlign: "center",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  borderRight: "1px solid #18181b",
                                  width: "12%",
                                }}
                              >
                                Qty
                              </th>
                              <th
                                style={{
                                  padding: "10px 14px",
                                  textAlign: "right",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  width: "20%",
                                }}
                              >
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr
                                key={item.id || idx}
                                style={{
                                  borderBottom: idx === order.items.length - 1 ? "none" : "1px solid #18181b",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "10px 14px",
                                    borderRight: "1px solid #18181b",
                                    verticalAlign: "top",
                                  }}
                                >
                                  <div className="fw-semibold text-dark">{item.productTitle}</div>
                                  <div className="text-muted small">
                                    SKU: {item.sku}
                                    {item.variantAttributes ? ` | ${item.variantAttributes}` : ""}
                                    {item.taxRate ? ` | Tax: ${item.taxRate}%` : ""}
                                  </div>
                                </td>
                                <td
                                  style={{
                                    padding: "10px 14px",
                                    textAlign: "right",
                                    borderRight: "1px solid #18181b",
                                    fontFamily: "monospace",
                                    verticalAlign: "top",
                                  }}
                                >
                                  ৳{Number(item.unitPrice).toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 14px",
                                    textAlign: "center",
                                    borderRight: "1px solid #18181b",
                                    fontFamily: "monospace",
                                    verticalAlign: "top",
                                  }}
                                >
                                  {item.quantity}
                                </td>
                                <td
                                  style={{
                                    padding: "10px 14px",
                                    textAlign: "right",
                                    fontFamily: "monospace",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    verticalAlign: "top",
                                  }}
                                >
                                  ৳{Number(item.totalPrice).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Notes/Terms & Totals Row */}
                      <div className="row align-items-start mb-4" style={{ fontSize: "12.5px" }}>
                        {/* Left: Notes / Terms */}
                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            NOTES / TERMS:
                          </div>
                          <div className="text-secondary mb-2" style={{ lineHeight: "1.5" }}>
                            Payment is due within 7 days of receiving this invoice. For returns or warranty claims, please retain this document intact.
                          </div>
                        </div>

                        {/* Right: Framed Compact Summary Table */}
                        <div className="col-6">
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              border: "1.5px solid #18181b",
                              fontSize: "12.5px",
                            }}
                          >
                            <tbody>
                              <tr style={{ borderBottom: "1px solid #18181b" }}>
                                <td style={{ padding: "7px 12px", borderRight: "1px solid #18181b", color: "#475569", width: "50%" }}>
                                  Sub-Total
                                </td>
                                <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                                  ৳{subtotal.toFixed(2)}
                                </td>
                              </tr>

                              {discountAmount > 0 && (
                                <tr style={{ borderBottom: "1px solid #18181b" }}>
                                  <td style={{ padding: "7px 12px", borderRight: "1px solid #18181b", color: "#16a34a" }}>
                                    Discount
                                  </td>
                                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#16a34a" }}>
                                    -৳{discountAmount.toFixed(2)}
                                  </td>
                                </tr>
                              )}

                              <tr style={{ borderBottom: "1px solid #18181b" }}>
                                <td style={{ padding: "7px 12px", borderRight: "1px solid #18181b", color: "#475569" }}>
                                  Shipping
                                </td>
                                <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                                  {shippingFee === 0 ? "FREE" : `৳${shippingFee.toFixed(2)}`}
                                </td>
                              </tr>

                              <tr style={{ borderBottom: "1px solid #18181b" }}>
                                <td style={{ padding: "7px 12px", borderRight: "1px solid #18181b", color: "#475569" }}>
                                  VAT ({taxRatePercent}%)
                                </td>
                                <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                                  ৳{effectiveTaxAmount.toFixed(2)}
                                </td>
                              </tr>

                              <tr>
                                <td style={{ padding: "9px 12px", borderRight: "1px solid #18181b", fontWeight: 800, color: "#0f172a", fontSize: "14px" }}>
                                  Total
                                </td>
                                <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 900, color: "#0f172a", fontSize: "15px" }}>
                                  ৳{computedGrandTotal.toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Payment Method & Prepared By Row */}
                      <div className="row mb-4" style={{ fontSize: "12px", lineHeight: "1.6" }}>
                        {/* Payment Method */}
                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            PAYMENT METHOD
                          </div>
                          {renderDynamicPaymentDetails()}
                        </div>

                        {/* Prepared By */}
                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            PREPARED BY
                          </div>
                          <div className="text-secondary">
                            <div className="text-dark fw-semibold">{preparerName}</div>
                            <div>{preparerDesignation}</div>
                            <div className="small text-muted mt-1">Computer Generated Invoice · Valid without signature</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DELIVERY ADDRESS & PACKING LABEL */}
                  {activeTab === "address" && (
                    <div className="delivery-label-content position-relative" style={{ minHeight: "920px", display: "flex", flexDirection: "column" }}>
                      {/* Top Header */}
                      <div className="mb-4">
                        <h1
                          className="text-dark fw-black mb-1"
                          style={{
                            fontSize: "32px",
                            fontWeight: 900,
                            letterSpacing: "-0.5px",
                            lineHeight: 1,
                            textTransform: "uppercase",
                            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                        >
                          DELIVERY LABEL
                        </h1>
                        <div className="text-secondary small" style={{ fontSize: "13px", lineHeight: "1.6" }}>
                          <div>Order Ref: <span className="fw-semibold text-dark">#{order.orderNumber}</span></div>
                          <div>Date: <span className="fw-semibold text-dark">{orderDateStr}</span></div>
                        </div>
                      </div>

                      {/* Sender vs Deliver To 2-Column Grid */}
                      <div className="row mb-4" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                        <div className="col-5">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            FROM (SENDER)
                          </div>
                          <div className="text-dark fw-semibold">A TO Z ECOMMERCE LTD.</div>
                          <div className="text-secondary small">
                            Central Fulfillment Hub, Sector 4, Banani, Dhaka-1213
                            <br />
                            Helpline: +880 1700-000000
                            <br />
                            support@a2z-ecommerce.com
                          </div>
                        </div>

                        <div className="col-7">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            DELIVER TO (RECIPIENT)
                          </div>
                          <div className="fs-5 fw-black text-dark mb-1">{order.recipientName}</div>
                          <div className="fs-6 fw-bold font-monospace text-dark mb-1">
                            📞 {order.recipientPhone}
                          </div>
                          <div className="text-secondary" style={{ fontSize: "13px" }}>
                            {formattedAddress}
                          </div>
                        </div>
                      </div>

                      {/* COD Collection Box / Payment Instruction Box */}
                      <div
                        className="p-3 mb-4 text-center"
                        style={{
                          border: "1.5px solid #18181b",
                          background: order.paymentStatus === "PAID" ? "#f0fdf4" : "#ffffff",
                        }}
                      >
                        {order.paymentStatus === "PAID" ? (
                          <div>
                            <div className="fw-black text-uppercase" style={{ fontSize: "14px", color: "#166534", letterSpacing: "0.5px" }}>
                              ✓ PREPAID PARCEL — ZERO CASH COLLECTION
                            </div>
                            <div className="small text-muted mt-0.5">
                              Payment verified via {paymentInfo.name}. Hand over package without collecting cash.
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="fw-bold text-uppercase" style={{ fontSize: "12px", color: "#475569", letterSpacing: "0.8px" }}>
                              CASH ON DELIVERY (COD) MANDATORY COLLECTION
                            </div>
                            <div
                              className="fw-black font-monospace my-1"
                              style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a" }}
                            >
                              COLLECT EXACT: ৳{computedGrandTotal.toFixed(2)}
                            </div>
                            <div className="small text-secondary">
                              Please inspect package seal and collect full amount before parcel handover.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Package Checklist Table */}
                      <div className="mb-4">
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            border: "1.5px solid #18181b",
                            fontSize: "12px",
                          }}
                        >
                          <thead>
                            <tr style={{ background: "#ffffff", borderBottom: "1.5px solid #18181b" }}>
                              <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, borderRight: "1px solid #18181b", width: "70%" }}>
                                Package Contents Summary ({order.items.length} {order.items.length === 1 ? "Item" : "Items"})
                              </th>
                              <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, borderRight: "1px solid #18181b", width: "15%" }}>
                                Qty
                              </th>
                              <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, width: "15%" }}>
                                Checked
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: idx === order.items.length - 1 ? "none" : "1px solid #18181b",
                                }}
                              >
                                <td style={{ padding: "8px 12px", borderRight: "1px solid #18181b" }}>
                                  <span className="fw-semibold text-dark">{item.productTitle}</span>{" "}
                                  <span className="text-muted small font-monospace">({item.sku})</span>
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "monospace", fontWeight: 600, borderRight: "1px solid #18181b" }}>
                                  {item.quantity}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>
                                  [ &nbsp;&nbsp; ]
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Logistics & Dispatch Signature Row */}
                      <div className="row mb-4" style={{ fontSize: "12px", lineHeight: "1.6" }}>
                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            LOGISTICS ROUTING
                          </div>
                          <div className="text-secondary">
                            <div>Partner: <strong className="text-dark">{primaryShipment?.courierName || "Steadfast Courier Partner"}</strong></div>
                            <div>Dispatch Hub: Banani Central Hub, Dhaka</div>
                            <div>Tracking: <strong className="text-dark font-monospace">{primaryShipment?.trackingNumber || `TRK-${order.orderNumber}`}</strong></div>
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="fw-bold text-dark text-uppercase mb-1" style={{ fontSize: "12px", letterSpacing: "0.5px" }}>
                            DISPATCHED BY
                          </div>
                          <div className="text-secondary">
                            <div className="text-dark fw-semibold">{preparerName}</div>
                            <div>{preparerDesignation}</div>
                            <div className="small text-muted mt-1">Authorized Courier Handover Slip</div>
                          </div>
                        </div>
                      </div>

                      {/* Rider Notes if any */}
                      {order.customerNotes && (
                        <div className="p-2 mb-3 rounded border bg-light small">
                          <strong className="text-dark">Rider Note:</strong> {order.customerNotes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: SHIPMENTS MANIFEST */}
                  {activeTab === "shipment" && (
                    <div className="shipments-manifest-content">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                        <div>
                          <h4 className="fw-black text-dark mb-0">
                            CONSIGNMENT DISPATCH VOUCHER
                          </h4>
                          <span className="text-muted small">
                            Courier Handover &amp; Transit Manifest
                          </span>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-primary fs-6 px-3 py-1 font-monospace">
                            Order #{order.orderNumber}
                          </span>
                        </div>
                      </div>

                      {/* Courier Details Card */}
                      <div className="p-3.5 rounded-3 border bg-light mb-4">
                        <div className="row g-3">
                          <div className="col-4">
                            <div className="small text-secondary">Designated Courier Partner</div>
                            <div className="fw-bold fs-6 text-dark">
                              {primaryShipment?.courierName || "Steadfast Courier / Fleet"}
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="small text-secondary">Tracking / Consignment ID</div>
                            <div className="fw-bold fs-6 font-monospace text-primary">
                              {primaryShipment?.trackingNumber || "PENDING-CONSIGNMENT"}
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="small text-secondary">Shipment Status</div>
                            <span className="badge bg-info text-dark fw-bold text-uppercase">
                              {order.shipmentStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recipient & Destination Info */}
                      <div className="border rounded-3 p-3 mb-4">
                        <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                          Destination &amp; Consignee
                        </h6>
                        <div className="row g-2 small">
                          <div className="col-6">
                            <strong>Recipient:</strong> {order.recipientName}
                            <br />
                            <strong>Phone:</strong> {order.recipientPhone}
                          </div>
                          <div className="col-6">
                            <strong>Address:</strong> {formattedAddress}
                          </div>
                        </div>
                      </div>

                      {/* Manifest Line Items */}
                      <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                        Manifested Line Items
                      </h6>
                      <table className="table table-bordered table-sm align-middle mb-4">
                        <thead className="table-light small text-secondary">
                          <tr>
                            <th>#</th>
                            <th>Product Description</th>
                            <th>SKU</th>
                            <th className="text-center">Quantity</th>
                            <th className="text-center">Inspection Check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="text-center font-monospace">{idx + 1}</td>
                              <td className="fw-semibold text-dark">{item.productTitle}</td>
                              <td className="font-monospace text-muted">{item.sku}</td>
                              <td className="text-center font-monospace fw-bold">
                                {item.quantity}
                              </td>
                              <td className="text-center font-monospace text-success fw-bold">
                                [ PASSED ]
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Financial Collection Summary */}
                      <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center mb-5">
                        <div>
                          <div className="small text-muted text-uppercase fw-bold">
                            Total Declared Value
                          </div>
                          <div className="fs-6 font-monospace fw-bold text-dark">
                            ৳{computedGrandTotal.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="small text-muted text-uppercase fw-bold">
                            Courier Settlement Collect
                          </div>
                          <div className="fs-5 font-monospace fw-black text-danger">
                            {order.paymentStatus === "PAID"
                              ? "৳0.00 (PREPAID)"
                              : `৳${computedGrandTotal.toFixed(2)} (COD)`}
                          </div>
                        </div>
                      </div>

                      {/* Handover Signatures */}
                      <div className="row text-center mt-5 pt-3">
                        <div className="col-6">
                          <div
                            className="border-top pt-2 mx-auto"
                            style={{ width: "70%", borderColor: "#94a3b8" }}
                          >
                            <div className="fw-bold text-dark small">
                              Dispatched By (Warehouse Officer)
                            </div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>
                              Signature &amp; Date
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div
                            className="border-top pt-2 mx-auto"
                            style={{ width: "70%", borderColor: "#94a3b8" }}
                          >
                            <div className="fw-bold text-dark small">
                              Received By (Courier Rider / Rep)
                            </div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>
                              Signature, Name &amp; Phone
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer bg-white border-top px-4 py-2.5 d-flex justify-content-between align-items-center no-print">
              <span className="small text-muted">
                Tip: Direct high-resolution A4 print with full styling and crisp typography.
              </span>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  disabled={isPrinting}
                  className="btn btn-primary btn-sm fw-bold px-3 d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={handlePrint}
                >
                  {isPrinting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Printing…</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-printer"></i>
                      <span>
                        Print {activeTab === "invoice" ? "Invoice" : activeTab === "address" ? "Address Label" : "Shipment Slip"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
