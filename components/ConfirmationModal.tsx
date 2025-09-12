"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { cva } from "class-variance-authority";
import { useFocusManagement } from "../hooks/useKeyboardNavigation";
// unnecessary comment
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

// Enum para os emojis dos tipos de modal
enum ModalEmojis {
  danger = "⚠️",
  warning = "⚠️",
  info = "ℹ️",
}

// Confirmation Modal Button Variants
const confirmationButtonStyles = cva(
  [
    "px-4",
    "py-2",
    "text-sm",
    "font-medium",
    "text-white",
    "rounded-md",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
  ],
  {
    variants: {
      type: {
        danger: ["bg-red-600", "hover:bg-red-700", "focus:ring-red-500"],
        warning: [
          "bg-yellow-600",
          "hover:bg-yellow-700",
          "focus:ring-yellow-500",
        ],
        info: ["bg-blue-600", "hover:bg-blue-700", "focus:ring-blue-500"],
      },
    },
    defaultVariants: {
      type: "info",
    },
  }
);

// Modal Icon Background Variants
const modalIconBackgroundStyles = cva(
  [
    "flex-shrink-0",
    "w-10",
    "h-10",
    "rounded-full",
    "flex",
    "items-center",
    "justify-center",
  ],
  {
    variants: {
      type: {
        danger: ["bg-red-100"],
        warning: ["bg-yellow-100"],
        info: ["bg-blue-100"],
      },
    },
    defaultVariants: {
      type: "info",
    },
  }
);

// Modal Icon Text Variants
const modalIconTextStyles = cva(["text-lg"], {
  variants: {
    type: {
      danger: ["text-red-600"],
      warning: ["text-yellow-600"],
      info: ["text-blue-600"],
    },
  },
  defaultVariants: {
    type: "info",
  },
});

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = "info",
}) => {
  const tCommon = useTranslations("common");
  const { containerRef, focusFirst, trapFocus } = useFocusManagement();

  const defaultConfirmText = confirmText || tCommon("confirm");
  const defaultCancelText = cancelText || tCommon("cancel");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => focusFirst(), 100);
    }
  }, [isOpen, focusFirst]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    } else {
      trapFocus(event.nativeEvent);
    }
  };

  // Render functions for better performance
  const renderModalIcon = () => {
    return (
      <div className={modalIconBackgroundStyles({ type })}>
        <span className={modalIconTextStyles({ type })} aria-hidden="true">
          {ModalEmojis[type]}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-message"
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-start space-x-4">
          {renderModalIcon()}

          <div className="flex-1 min-w-0">
            <h3
              id="confirmation-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {title}
            </h3>
            <p
              id="confirmation-message"
              className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {defaultCancelText}
          </button>
          <button
            onClick={onConfirm}
            className={confirmationButtonStyles({ type })}
          >
            {defaultConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
