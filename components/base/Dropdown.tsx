"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { cva } from "class-variance-authority";

interface DropdownItem {
  id: string;
  label: string;
  value: any;
  disabled?: boolean;
  icon?: ReactNode;
}

interface DropdownProps<T extends DropdownItem> {
  items: T[];
  selectedItem?: T;
  onItemSelect: (item: T | undefined) => void;
  placeholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  renderItem?: (item: T, isSelected: boolean) => ReactNode;
  renderSelectedItem?: (item: T) => ReactNode;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

// Dropdown Button Variants
const dropdownButtonStyles = cva(
  [
    "w-full",
    "flex",
    "items-center",
    "justify-between",
    "text-left",
    "text-gray-900",
    "bg-white",
    "border",
    "border-gray-400",
    "rounded-lg",
    "hover:bg-gray-50",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-blue-500",
    "focus:border-blue-600",
    "shadow-sm",
  ],
  {
    variants: {
      size: {
        sm: ["px-3", "py-2", "text-sm"],
        md: ["px-4", "py-3", "text-sm"],
        lg: ["px-5", "py-4", "text-base"],
      },
      state: {
        default: [],
        disabled: ["bg-gray-100", "cursor-not-allowed", "text-gray-500"],
      },
    },
    defaultVariants: {
      size: "md",
      state: "default",
    },
  }
);

const dropdownMenuStyles = cva([
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

const dropdownItemStyles = cva(
  [
    "px-4",
    "py-3",
    "cursor-pointer",
    "border-b",
    "border-gray-100",
    "last:border-b-0",
    "transition-colors",
    "flex",
    "items-center",
    "gap-3",
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

export function Dropdown<T extends DropdownItem>({
  items,
  selectedItem,
  onItemSelect,
  placeholder = "Selecione uma opção...",
  emptyMessage = "Nenhuma opção disponível",
  allowClear = true,
  renderItem,
  renderSelectedItem,
  className = "",
  disabled = false,
  size = "md",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemSelect = (item: T | undefined) => {
    onItemSelect(item);
    setIsOpen(false);
    setSelectedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setSelectedIndex(0);
        } else {
          setSelectedIndex((prev) => {
            const nextIndex = prev < items.length - 1 ? prev + 1 : prev;
            // Skip disabled items
            const nextItem = items[nextIndex];
            return nextItem?.disabled ? prev : nextIndex;
          });
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setSelectedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : -1;
            // Skip disabled items
            if (nextIndex >= 0) {
              const nextItem = items[nextIndex];
              return nextItem?.disabled ? prev : nextIndex;
            }
            return nextIndex;
          });
        }
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setSelectedIndex(
            selectedItem
              ? items.findIndex((item) => item.id === selectedItem.id)
              : 0
          );
        } else if (
          selectedIndex >= 0 &&
          items[selectedIndex] &&
          !items[selectedIndex].disabled
        ) {
          handleItemSelect(items[selectedIndex]);
        }
        break;

      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        buttonRef.current?.focus();
        break;

      case "Tab":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleButtonClick = () => {
    if (disabled) return;

    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedIndex(
        selectedItem
          ? items.findIndex((item) => item.id === selectedItem.id)
          : 0
      );
    }
  };

  // Render functions for better performance
  const renderSelectedItemContent = () => {
    if (!selectedItem) {
      return <span className="text-gray-500">{placeholder}</span>;
    }

    return (
      <>
        {selectedItem.icon}
        {renderSelectedItem
          ? renderSelectedItem(selectedItem)
          : selectedItem.label}
      </>
    );
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
        className="text-gray-400 hover:text-gray-600 p-1 rounded"
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

  const renderEmptyState = () => (
    <li className="px-4 py-3 text-center text-gray-500">{emptyMessage}</li>
  );

  const renderDropdownItems = () => {
    return items.map((item, index) => (
      <li
        key={item.id}
        role="option"
        aria-selected={index === selectedIndex}
        onClick={() => !item.disabled && handleItemSelect(item)}
        className={dropdownItemStyles({
          state: item.disabled
            ? "disabled"
            : index === selectedIndex
            ? "selected"
            : "default",
        })}
      >
        {item.icon}
        {renderItem ? (
          renderItem(item, index === selectedIndex)
        ) : (
          <span className="flex-1">{item.label}</span>
        )}
      </li>
    ));
  };

  const renderDropdownMenu = () => {
    if (!isOpen) return null;

    return (
      <ul role="listbox" className={dropdownMenuStyles()}>
        {items.length === 0 ? renderEmptyState() : renderDropdownItems()}
      </ul>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        className={dropdownButtonStyles({
          size,
          state: disabled ? "disabled" : "default",
        })}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={selectedItem ? selectedItem.label : placeholder}
      >
        <span className="flex-1 truncate flex items-center gap-3">
          {renderSelectedItemContent()}
        </span>

        <div className="flex items-center gap-2">
          {renderClearButton()}
          {renderDropdownArrow()}
        </div>
      </button>

      {renderDropdownMenu()}
    </div>
  );
}

export default Dropdown;
