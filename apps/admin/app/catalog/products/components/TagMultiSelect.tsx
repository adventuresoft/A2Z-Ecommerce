"use client";

import React, { useState, useEffect, useRef } from "react";
import { TagItem, tagsApi } from "@/services/tags";

export interface SelectedTag {
  id?: string;
  name: string;
  colorCode?: string | null;
  isNew?: boolean;
}

interface TagMultiSelectProps {
  selectedTagIds: string[];
  selectedNewTags?: string[];
  initialTags?: Array<{ id: string; name: string; colorCode?: string | null }>;
  onChange: (tagIds: string[], newTags: string[]) => void;
  disabled?: boolean;
}

export function TagMultiSelect({
  selectedTagIds,
  selectedNewTags = [],
  initialTags = [],
  onChange,
  disabled = false,
}: TagMultiSelectProps) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load available catalog tags
  useEffect(() => {
    let isMounted = true;
    async function loadTags() {
      setLoading(true);
      try {
        const res = await tagsApi.getTags({ limit: 100, isActive: true });
        if (isMounted) {
          setAllTags(res.items);
        }
      } catch (err) {
        console.error("Failed to load catalog tags:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTags();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Build list of selected tag items
  const selectedItems: SelectedTag[] = [
    ...selectedTagIds.map((id) => {
      const foundInAll = allTags.find((t) => t.id === id);
      const foundInInitial = initialTags.find((t) => t.id === id);
      return {
        id,
        name: foundInAll?.name || foundInInitial?.name || id,
        colorCode: foundInAll?.colorCode || foundInInitial?.colorCode || null,
        isNew: false,
      };
    }),
    ...selectedNewTags.map((name) => ({
      name,
      colorCode: null,
      isNew: true,
    })),
  ];

  // Filter dropdown suggestions
  const normalizedInput = inputValue.trim().toLowerCase();
  const availableSuggestions = allTags.filter((tag) => {
    const isAlreadySelected = selectedTagIds.includes(tag.id);
    if (isAlreadySelected) return false;
    if (!normalizedInput) return true;
    return (
      tag.name.toLowerCase().includes(normalizedInput) ||
      tag.slug.toLowerCase().includes(normalizedInput)
    );
  });

  const exactMatchExists = allTags.some(
    (tag) => tag.name.toLowerCase() === normalizedInput,
  );
  const isAlreadyInNewTags = selectedNewTags.some(
    (name) => name.toLowerCase() === normalizedInput,
  );

  const canCreateNew =
    Boolean(normalizedInput) && !exactMatchExists && !isAlreadyInNewTags;

  const handleSelectExisting = (tag: TagItem) => {
    if (disabled) return;
    const newTagIds = [...selectedTagIds, tag.id];
    onChange(newTagIds, selectedNewTags);
    setInputValue("");
  };

  const handleAddNew = (tagName: string) => {
    if (disabled) return;
    const trimmed = tagName.trim();
    if (!trimmed) return;

    // If matches an existing tag, pick that one
    const existing = allTags.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        onChange([...selectedTagIds, existing.id], selectedNewTags);
      }
    } else {
      if (!selectedNewTags.includes(trimmed)) {
        onChange(selectedTagIds, [...selectedNewTags, trimmed]);
      }
    }
    setInputValue("");
  };

  const handleRemove = (item: SelectedTag) => {
    if (disabled) return;
    if (item.id) {
      onChange(
        selectedTagIds.filter((id) => id !== item.id),
        selectedNewTags,
      );
    } else {
      onChange(
        selectedTagIds,
        selectedNewTags.filter((name) => name !== item.name),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (canCreateNew) {
        handleAddNew(inputValue);
      } else if (availableSuggestions.length > 0) {
        handleSelectExisting(availableSuggestions[0]);
      }
    } else if (e.key === "Backspace" && !inputValue && selectedItems.length > 0) {
      handleRemove(selectedItems[selectedItems.length - 1]);
    }
  };

  return (
    <div className="position-relative" ref={containerRef}>
      {/* Selected tags badges and input box */}
      <div
        className={`form-control d-flex flex-wrap align-items-center gap-1 p-2 ${
          isOpen ? "border-primary shadow-sm" : ""
        } ${disabled ? "bg-light" : ""}`}
        style={{ minHeight: "44px", cursor: "text" }}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {selectedItems.map((item, idx) => {
          const bgColor = item.colorCode || (item.isNew ? "#6c757d" : "#0d6efd");
          return (
            <span
              key={item.id || `new-${idx}`}
              className="badge d-inline-flex align-items-center gap-1 py-1 px-2 text-white"
              style={{
                backgroundColor: bgColor,
                fontSize: "0.85rem",
                fontWeight: 500,
                borderRadius: "1rem",
              }}
            >
              {item.isNew && <i className="bi bi-sparkles me-1 small"></i>}
              {item.name}
              {!disabled && (
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  style={{ width: "0.5rem", height: "0.5rem", padding: "0" }}
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                />
              )}
            </span>
          );
        })}

        <input
          type="text"
          className="border-0 bg-transparent flex-grow-1 p-0 m-0"
          style={{
            minWidth: "120px",
            outline: "none",
            fontSize: "0.9rem",
            color: "inherit",
          }}
          placeholder={
            selectedItems.length === 0
              ? "Select or type new tags..."
              : "Add another tag..."
          }
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && !disabled && (
        <div
          className="dropdown-menu show w-100 p-1 shadow-sm mt-1"
          style={{
            maxHeight: "220px",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          {loading && (
            <div className="text-center py-2 text-muted small">
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Loading tags...
            </div>
          )}

          {canCreateNew && (
            <button
              type="button"
              className="dropdown-item d-flex align-items-center gap-2 py-2 text-primary fw-medium"
              onClick={() => handleAddNew(inputValue)}
            >
              <i className="bi bi-plus-circle-fill"></i>
              Create new tag:{" "}
              <span className="badge bg-primary text-white ms-1">
                {inputValue.trim()}
              </span>
            </button>
          )}

          {!loading && availableSuggestions.length === 0 && !canCreateNew && (
            <div className="text-muted small px-3 py-2">
              No matching tags found.
            </div>
          )}

          {availableSuggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="dropdown-item d-flex align-items-center justify-content-between py-2"
              onClick={() => handleSelectExisting(tag)}
            >
              <div className="d-flex align-items-center gap-2">
                {tag.colorCode && (
                  <span
                    className="rounded-circle d-inline-block border"
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: tag.colorCode,
                    }}
                  />
                )}
                <span>{tag.name}</span>
                <span className="text-muted small">({tag.slug})</span>
              </div>
              {tag.productCount > 0 && (
                <span className="badge bg-light text-secondary border small">
                  {tag.productCount} products
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
