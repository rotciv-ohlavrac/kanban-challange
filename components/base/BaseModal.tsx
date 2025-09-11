"use client";

import React, { useEffect, ReactNode } from "react";
import { cva } from "class-variance-authority";
import { useFocusManagement } from "../../hooks/useKeyboardNavigation";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

// Modal Size Variants
const modalStyles = cva(
  [
    "bg-white",
    "rounded-lg",
    "shadow-xl",
    "mx-4",
    "w-full",
    "max-h-[90vh]",
    "overflow-y-auto",
  ],
  {
    variants: {
      size: {
        sm: ["max-w-sm"],
        md: ["max-w-md"],
        lg: ["max-w-lg"],
        xl: ["max-w-xl"],
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = "",
}) => {
  const { containerRef, focusFirst, trapFocus } = useFocusManagement();

  useEffect(() => {
    if (isOpen) {
      // Focus first element after modal opens
      setTimeout(() => focusFirst(), 100);

      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, focusFirst]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (closeOnEscape && event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else {
      trapFocus(event.nativeEvent);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Render functions for better performance
  const renderModalContent = () => (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`${modalStyles({ size })} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {(title || showCloseButton) && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          {title && (
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="Fechar modal"
            >
              <svg
                className="w-6 h-6"
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
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {renderModalContent()}
    </div>
  );
};

export default BaseModal;
