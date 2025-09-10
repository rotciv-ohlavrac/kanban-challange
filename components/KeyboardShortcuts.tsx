"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useKeyboardNavigation,
  useFocusManagement,
} from "../hooks/useKeyboardNavigation";

export const KeyboardShortcuts: React.FC = () => {
  const t = useTranslations("keyboard");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const { containerRef, focusFirst, trapFocus } = useFocusManagement();

  useKeyboardNavigation({
    onEscape: () => {
      if (isOpen) {
        setIsOpen(false);
      }
    },
    enabled: isOpen,
  });

  const shortcuts = [
    { key: "N", description: t("newTask") },
    { key: "/", description: t("search") },
    { key: "Esc", description: t("escape") },
    { key: "Enter", description: t("enter") },
    { key: "↑↓←→", description: t("arrowKeys") },
    { key: "Tab", description: t("tab") },
    { key: "Shift+Tab", description: t("shiftTab") },
    { key: "Space", description: t("space") },
  ];

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => focusFirst(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        aria-label={t("shortcuts")}
        title={t("shortcuts")}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
            onKeyDown={(e) => trapFocus(e.nativeEvent)}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                id="shortcuts-title"
                className="text-xl font-bold text-gray-900"
              >
                {t("shortcuts")}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label={tCommon("close")}
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tCommon("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
