"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ProductItem, getProducts } from "../../services/products";

export interface VariantOption {
  variantId: string;
  productId: string;
  productTitle: string;
  categoryName?: string;
  sku: string;
  attributesSummary: string;
  price: number;
  regularPrice: number;
  salePrice: number | null;
  stock: number;
  thumbnailUrl?: string | null;
}

export interface SearchableVariantSelectProps {
  products: ProductItem[];
  inventoryMap: Record<string, number>;
  selectedVariantId: string;
  onSelect: (variant: VariantOption | null) => void;
  onProductsLoaded?: (newProducts: ProductItem[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Helper to highlight matching search tokens inside text (Select2 search UX)
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !query.trim()) return text;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (tokens.length === 0) return text;

  const regex = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="p-0 bg-warning bg-opacity-25 text-dark fw-bold rounded-1"
        style={{ padding: "0 2px" }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchableVariantSelect({
  products,
  inventoryMap,
  selectedVariantId,
  onSelect,
  onProductsLoaded,
  disabled = false,
  placeholder = "Search product name, SKU, variant, price...",
}: SearchableVariantSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Flatten catalog products into searchable variant options
  const allVariants: VariantOption[] = useMemo(() => {
    const list: VariantOption[] = [];

    for (const prod of products) {
      for (const v of prod.variants || []) {
        const stock = inventoryMap[v.id] ?? 0;
        const price =
          v.salePrice !== null && v.salePrice !== undefined
            ? Number(v.salePrice)
            : Number(v.regularPrice);

        const attrSummary = (v.attributes || [])
          .map((a) =>
            a.label || a.value
              ? `${a.attributeName ? a.attributeName + ": " : ""}${a.label || a.value}`
              : ""
          )
          .filter(Boolean)
          .join(", ");

        list.push({
          variantId: v.id,
          productId: prod.id,
          productTitle: prod.title,
          categoryName: prod.category?.name,
          sku: v.sku,
          attributesSummary: attrSummary || "Standard Variant",
          price,
          regularPrice: Number(v.regularPrice),
          salePrice:
            v.salePrice !== null && v.salePrice !== undefined
              ? Number(v.salePrice)
              : null,
          stock,
          thumbnailUrl: v.imageUrl || prod.thumbnailUrl,
        });
      }
    }

    return list;
  }, [products, inventoryMap]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return allVariants.find((v) => v.variantId === selectedVariantId) || null;
  }, [allVariants, selectedVariantId]);

  // Filter options based on multi-token search
  const filteredVariants = useMemo(() => {
    if (!searchTerm.trim()) return allVariants;

    const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return allVariants.filter((v) => {
      const combined = `${v.productTitle} ${v.sku} ${v.attributesSummary} ${v.categoryName || ""} ${v.price}`.toLowerCase();
      return tokens.every((token) => combined.includes(token));
    });
  }, [allVariants, searchTerm]);

  // Reset highlighted item when query or items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredVariants.length, searchTerm]);

  // Remote search fallback: debounced search for large catalogs
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearchingRemote(true);
        const res = await getProducts({ search: searchTerm.trim(), limit: 40 });
        if (res.items && res.items.length > 0 && onProductsLoaded) {
          onProductsLoaded(res.items);
        }
      } catch {
        // silent fallback to local filter
      } finally {
        setIsSearchingRemote(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, onProductsLoaded]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  // Outside click handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input with brief delay for render
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      setSearchTerm("");
      setHighlightedIndex(0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  const handleSelect = useCallback(
    (variant: VariantOption) => {
      onSelect(variant);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onSelect]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredVariants.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredVariants.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredVariants[highlightedIndex]) {
        handleSelect(filteredVariants[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="position-relative select2-wrapper" ref={containerRef}>
      {/* Select2 Trigger Box */}
      <div
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`form-control form-control-sm d-flex align-items-center justify-content-between cursor-pointer user-select-none ${
          isOpen ? "border-primary shadow-sm" : ""
        } ${disabled ? "bg-light opacity-75" : "bg-white"}`}
        style={{
          minHeight: "38px",
          cursor: disabled ? "not-allowed" : "pointer",
          borderColor: isOpen ? "#0d6efd" : "#dee2e6",
          transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
        }}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <div className="d-flex align-items-center gap-2 overflow-hidden text-truncate me-2 py-0">
          {selectedOption ? (
            <div className="d-flex align-items-center gap-2 text-truncate">
              {selectedOption.thumbnailUrl ? (
                <img
                  src={selectedOption.thumbnailUrl}
                  alt={selectedOption.productTitle}
                  className="rounded flex-shrink-0 border"
                  style={{ width: "24px", height: "24px", objectFit: "cover" }}
                />
              ) : (
                <span
                  className="rounded bg-light border d-inline-flex align-items-center justify-content-center text-secondary flex-shrink-0"
                  style={{ width: "24px", height: "24px", fontSize: "11px" }}
                >
                  <i className="bi bi-box"></i>
                </span>
              )}
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle flex-shrink-0" style={{ fontSize: "10px" }}>
                {selectedOption.sku}
              </span>
              <span className="fw-semibold text-dark text-truncate" style={{ fontSize: "12px" }}>
                {selectedOption.productTitle}
              </span>
              <span className="text-muted text-truncate d-none d-sm-inline" style={{ fontSize: "11px" }}>
                ({selectedOption.attributesSummary})
              </span>
              <span className="fw-bold text-success ms-1 flex-shrink-0" style={{ fontSize: "12px" }}>
                BDT {selectedOption.price.toFixed(2)}
              </span>
              {selectedOption.stock <= 0 ? (
                <span className="badge bg-danger text-white small flex-shrink-0" style={{ fontSize: "10px" }}>
                  Out of Stock
                </span>
              ) : selectedOption.stock <= 5 ? (
                <span className="badge bg-warning text-dark small flex-shrink-0" style={{ fontSize: "10px" }}>
                  Stock: {selectedOption.stock}
                </span>
              ) : (
                <span className="badge bg-success-subtle text-success small flex-shrink-0" style={{ fontSize: "10px" }}>
                  Stock: {selectedOption.stock}
                </span>
              )}
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "12px" }}>
              <i className="bi bi-search text-secondary" style={{ fontSize: "11px" }}></i>
              <span>Select product variant...</span>
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 me-1"
              title="Clear selection"
              onClick={handleClear}
            >
              <i className="bi bi-x-circle-fill fs-6 text-secondary hover-text-danger"></i>
            </button>
          )}
          <i
            className={`bi bi-chevron-down text-muted`}
            style={{
              fontSize: "12px",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          ></i>
        </div>
      </div>

      {/* Select2 Dropdown Overlay */}
      {isOpen && (
        <div
          className="card shadow-lg border position-absolute start-0 end-0 mt-1"
          style={{
            zIndex: 1060,
            borderRadius: "0.375rem",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #ced4da",
            backgroundColor: "#fff",
            animation: "fadeIn 0.15s ease-in-out",
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Top Search Input Box (Select2 Style) */}
          <div className="p-2 border-bottom bg-light">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-primary">
                {isSearchingRemote ? (
                  <span className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: "14px", height: "14px" }}></span>
                ) : (
                  <i className="bi bi-search"></i>
                )}
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control border-start-0 ps-0 shadow-none"
                style={{ fontSize: "12px" }}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              {searchTerm && (
                <button
                  className="btn btn-outline-secondary bg-white border-start-0"
                  type="button"
                  title="Clear search"
                  onClick={() => {
                    setSearchTerm("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <i className="bi bi-x-lg text-secondary" style={{ fontSize: "11px" }}></i>
                </button>
              )}
            </div>

            {/* Quick summary and keyboard tips */}
            <div className="d-flex align-items-center justify-content-between mt-1 px-1">
              <small className="text-muted" style={{ fontSize: "11px" }}>
                {isSearchingRemote ? (
                  <span className="text-primary">
                    <span className="spinner-border spinner-border-sm me-1" style={{ width: "10px", height: "10px" }}></span>
                    Searching catalog...
                  </span>
                ) : (
                  <>Found <strong>{filteredVariants.length}</strong> matching variant{filteredVariants.length === 1 ? "" : "s"}</>
                )}
              </small>
              <small className="text-secondary" style={{ fontSize: "11px" }}>
                <span className="badge bg-secondary-subtle text-secondary me-1">↑↓</span> Navigate{" "}
                <span className="badge bg-secondary-subtle text-secondary ms-1 me-1">↵</span> Select{" "}
                <span className="badge bg-secondary-subtle text-secondary ms-1">Esc</span>
              </small>
            </div>
          </div>

          {/* Search Results List */}
          <div
            ref={listRef}
            className="overflow-auto py-1"
            style={{ maxHeight: "300px" }}
            role="listbox"
          >
            {filteredVariants.length === 0 ? (
              <div className="text-center py-4 px-3 text-muted">
                <i className="bi bi-search fs-3 text-secondary opacity-50 d-block mb-1"></i>
                <div className="small fw-semibold text-dark">No matching product variants found</div>
                <div className="text-secondary small mt-1">
                  {searchTerm ? (
                    <>No items match &quot;<strong>{searchTerm}</strong>&quot;. Try checking for typos or searching by SKU.</>
                  ) : (
                    <>No products found in the catalog.</>
                  )}
                </div>
              </div>
            ) : (
              filteredVariants.map((item, index) => {
                const isSelected = item.variantId === selectedVariantId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={item.variantId}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`px-3 py-2 border-bottom cursor-pointer transition-colors d-flex align-items-center justify-content-between ${
                      isHighlighted
                        ? "bg-primary-subtle text-primary-emphasis"
                        : isSelected
                        ? "bg-light text-dark"
                        : "text-dark"
                    }`}
                    style={{
                      cursor: "pointer",
                      borderLeft: isHighlighted
                        ? "4px solid #0d6efd"
                        : isSelected
                        ? "4px solid #198754"
                        : "4px solid transparent",
                      backgroundColor: isHighlighted
                        ? "#e7f1ff"
                        : isSelected
                        ? "#f8f9fa"
                        : "transparent",
                      transition: "background-color 0.1s ease, border-left 0.1s ease",
                    }}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.productTitle}
                          className="rounded flex-shrink-0 border"
                          style={{
                            width: "30px",
                            height: "30px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="rounded bg-light flex-shrink-0 d-flex align-items-center justify-content-center border text-secondary"
                          style={{ width: "30px", height: "30px", fontSize: "11px" }}
                        >
                          <i className="bi bi-box"></i>
                        </div>
                      )}

                      <div className="overflow-hidden">
                        <div className="d-flex align-items-center gap-1 flex-wrap">
                          <span className="fw-semibold text-dark text-truncate" style={{ fontSize: "12px" }}>
                            {highlightMatch(item.productTitle, searchTerm)}
                          </span>
                          <span
                            className="badge bg-secondary-subtle text-secondary-emphasis"
                            style={{ fontSize: "10px" }}
                          >
                            {highlightMatch(item.sku, searchTerm)}
                          </span>
                          {item.categoryName && (
                            <span
                              className="badge bg-light text-muted border d-none d-md-inline"
                              style={{ fontSize: "10px" }}
                            >
                              {item.categoryName}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-muted text-truncate"
                          style={{ fontSize: "11px" }}
                        >
                          <i className="bi bi-tag me-1 text-secondary opacity-75"></i>
                          {highlightMatch(item.attributesSummary, searchTerm)}
                        </div>
                      </div>
                    </div>

                    <div className="text-end flex-shrink-0 ms-2">
                      <div className="fw-bold text-dark" style={{ fontSize: "12px" }}>
                        BDT {item.price.toFixed(2)}
                        {item.salePrice && item.regularPrice > item.price && (
                          <del className="text-muted ms-1 small fw-normal" style={{ fontSize: "10px" }}>
                            {item.regularPrice.toFixed(0)}
                          </del>
                        )}
                      </div>
                      <div>
                        {item.stock <= 0 ? (
                          <span
                            className="badge bg-danger-subtle text-danger"
                            style={{ fontSize: "10px" }}
                          >
                            Out of Stock
                          </span>
                        ) : item.stock <= 5 ? (
                          <span
                            className="badge bg-warning-subtle text-warning-emphasis"
                            style={{ fontSize: "10px" }}
                          >
                            Stock: {item.stock}
                          </span>
                        ) : (
                          <span
                            className="badge bg-success-subtle text-success"
                            style={{ fontSize: "10px" }}
                          >
                            Stock: {item.stock}
                          </span>
                        )}
                        {isSelected && (
                          <i
                            className="bi bi-check-circle-fill text-success ms-1"
                            title="Currently selected"
                          ></i>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Footer */}
          <div className="px-3 py-1 bg-light border-top d-flex align-items-center justify-content-between text-muted" style={{ fontSize: "11px" }}>
            <span>
              <i className="bi bi-box-seam me-1"></i> Product Variant Selector
            </span>
            {selectedOption && (
              <span className="text-success fw-semibold">
                Selected: {selectedOption.sku}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
