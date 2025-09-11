"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { cva } from "class-variance-authority";

interface AutocompleteItem {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
}

interface AutocompleteProps<T extends AutocompleteItem> {
  items: T[];
  selectedItem?: T;
  onItemSelect: (item: T | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  allowClear?: boolean;
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  renderSelectedItem?: (item: T) => ReactNode;
  filterFn?: (item: T, searchTerm: string) => boolean;
  className?: string;
  disabled?: boolean;
}

// Autocomplete Variants
const autocompleteStyles = cva(
  [
    "w-full",
    "px-4",
    "py-3",
    "text-gray-900",
    "bg-white",
    "border",
    "border-gray-400",
    "rounded-lg",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-blue-500",
    "focus:border-blue-600",
    "shadow-sm",
    "placeholder-gray-600",
  ],
  {
    variants: {
      state: {
        default: [],
        disabled: ["bg-gray-100", "cursor-not-allowed", "text-gray-500"],
        loading: ["cursor-wait"],
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

const dropdownStyles = cva([
  "absolute",
  "z-50",
  "w-full",
  "mt-1",
  "bg-white",
  "border",
  "border-gray-200",
  "rounded-lg",
  "shadow-lg",
  "max-h-60",
  "overflow-y-auto",
]);

const itemStyles = cva(
  [
    "px-4",
    "py-3",
    "cursor-pointer",
    "border-b",
    "border-gray-100",
    "last:border-b-0",
    "transition-colors",
  ],
  {
    variants: {
      state: {
        default: ["hover:bg-gray-50", "text-gray-900"],
        selected: ["bg-blue-100", "border-blue-200", "text-gray-900"],
        disabled: ["cursor-not-allowed", "text-gray-400", "bg-gray-50"],
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export function Autocomplete<T extends AutocompleteItem>({
  items,
  selectedItem,
  onItemSelect,
  placeholder = "Selecione...",
  searchPlaceholder = "Digite para buscar...",
  emptyMessage = "Nenhum item encontrado",
  isLoading = false,
  allowClear = true,
  renderItem,
  renderSelectedItem,
  filterFn,
  className = "",
  disabled = false,
}: AutocompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSearch, setShowSearch] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default filter function
  const defaultFilterFn = (item: T, term: string) =>
    item.label.toLowerCase().includes(term.toLowerCase());

  const currentFilterFn = filterFn || defaultFilterFn;

  // Filtered items
  const filteredItems = searchTerm.trim()
    ? items.filter((item) => currentFilterFn(item, searchTerm))
    : items;

  const showDropdown = isOpen && (filteredItems.length > 0 || isLoading);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current && filteredItems.length > 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        const container = listRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();

        const isVisible =
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;

        if (!isVisible) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }
  }, [selectedIndex, filteredItems.length]);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowSearch(false);
        setSearchTerm("");
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemSelect = (item: T | undefined) => {
    onItemSelect(item);
    setIsOpen(false);
    setShowSearch(false);
    setSearchTerm("");
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setShowSearch(true);
        } else {
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        break;

      case "Enter":
        event.preventDefault();
        if (isOpen && selectedIndex >= 0 && filteredItems[selectedIndex]) {
          handleItemSelect(filteredItems[selectedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
          setShowSearch(true);
        }
        break;

      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setShowSearch(false);
        setSearchTerm("");
        setSelectedIndex(-1);
        break;

      case "Tab":
        setIsOpen(false);
        setShowSearch(false);
        setSearchTerm("");
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);

    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    if (disabled) return;

    if (!isOpen) {
      setIsOpen(true);
      setShowSearch(true);
    }
  };

  const getInputState = () => {
    if (disabled) return "disabled";
    if (isLoading) return "loading";
    return "default";
  };

  // Render functions for better performance
  const renderInputOrButton = () => {
    if (showSearch) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className={autocompleteStyles({ state: getInputState() })}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={showDropdown ? "autocomplete-list" : undefined}
          aria-activedescendant={
            selectedIndex >= 0
              ? `autocomplete-item-${selectedIndex}`
              : undefined
          }
        />
      );
    }

    return (
      <button
        type="button"
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        className={`${autocompleteStyles({
          state: getInputState(),
        })} text-left flex items-center justify-between`}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex-1 truncate">{renderSelectedItemContent()}</span>
        <div className="flex items-center gap-2">
          {renderClearButton()}
          {renderDropdownArrow()}
        </div>
      </button>
    );
  };

  const renderSelectedItemContent = () => {
    if (!selectedItem) {
      return <span className="text-gray-500">{placeholder}</span>;
    }

    return renderSelectedItem
      ? renderSelectedItem(selectedItem)
      : selectedItem.label;
  };

  const renderClearButton = () => {
    if (!allowClear || !selectedItem || disabled) return null;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleItemSelect(undefined);
        }}
        className="text-gray-400 hover:text-gray-600 p-1"
        aria-label="Limpar seleção"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    );
  };

  const renderDropdownArrow = () => (
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );

  const renderLoadingState = () => (
    <li className="px-4 py-3 text-center text-gray-500">
      <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        Carregando...
      </div>
    </li>
  );

  const renderEmptyState = () => (
    <li className="px-4 py-3 text-center text-gray-500">{emptyMessage}</li>
  );

  const renderDropdownItems = () => {
    return filteredItems.map((item, index) => (
      <li
        key={item.id}
        id={`autocomplete-item-${index}`}
        role="option"
        aria-selected={index === selectedIndex}
        onClick={() => !item.disabled && handleItemSelect(item)}
        className={itemStyles({
          state: item.disabled
            ? "disabled"
            : index === selectedIndex
            ? "selected"
            : "default",
        })}
      >
        {renderItem ? renderItem(item, index === selectedIndex) : item.label}
      </li>
    ));
  };

  const renderDropdownContent = () => {
    if (isLoading) return renderLoadingState();
    if (filteredItems.length === 0) return renderEmptyState();
    return renderDropdownItems();
  };

  const renderDropdown = () => {
    if (!showDropdown) return null;

    return (
      <ul
        ref={listRef}
        id="autocomplete-list"
        role="listbox"
        className={dropdownStyles()}
      >
        {renderDropdownContent()}
      </ul>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {renderInputOrButton()}
      {renderDropdown()}
    </div>
  );
}

export default Autocomplete;
