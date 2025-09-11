"use client";

import React, { useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { cva } from "class-variance-authority";
import {
  useKeyboardNavigation,
  useFocusManagement,
} from "../hooks/useKeyboardNavigation";

const languages = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

// Language Option Variants
const languageOptionStyles = cva(
  [
    "w-full",
    "flex",
    "items-center",
    "gap-2",
    "px-3",
    "py-2",
    "text-sm",
    "text-left",
    "hover:bg-gray-50",
    "focus:bg-gray-50",
    "focus:outline-none",
  ],
  {
    variants: {
      isSelected: {
        true: ["bg-blue-50", "text-blue-700", "font-medium"],
        false: ["text-gray-700"],
      },
      isHighlighted: {
        true: ["bg-gray-50"],
        false: [],
      },
    },
    compoundVariants: [
      {
        isSelected: true,
        isHighlighted: true,
        class: ["bg-blue-50"], // Selected state takes precedence
      },
    ],
    defaultVariants: {
      isSelected: false,
      isHighlighted: false,
    },
  }
);

// Dropdown Arrow Variants
const dropdownArrowStyles = cva(["w-4", "h-4", "transition-transform"], {
  variants: {
    isOpen: {
      true: ["rotate-180"],
      false: [],
    },
  },
  defaultVariants: {
    isOpen: false,
  },
});

export const LanguageSelector: React.FC = () => {
  const t = useTranslations("accessibility");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { containerRef, focusFirst, trapFocus } = useFocusManagement();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    router.push(pathname, { locale: langCode });
    setIsOpen(false);
    setSelectedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < languages.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : languages.length - 1
        );
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleLanguageChange(languages[selectedIndex].code);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSelectedIndex(languages.findIndex((lang) => lang.code === locale));
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    // Close dropdown if focus moves outside the component
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Render functions for better performance
  const renderCheckIcon = (isSelected: boolean) => {
    if (!isSelected) return null;

    return (
      <svg
        className="w-4 h-4 ml-auto text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const renderLanguageOptions = () => {
    return languages.map((language, index) => {
      const isSelected = language.code === locale;
      const isHighlighted = index === selectedIndex;

      return (
        <button
          key={language.code}
          role="option"
          aria-selected={isSelected}
          onClick={() => handleLanguageChange(language.code)}
          className={languageOptionStyles({ isSelected, isHighlighted })}
        >
          <span className="text-base">{language.flag}</span>
          <span>{language.name}</span>
          {renderCheckIcon(isSelected)}
        </button>
      );
    });
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    return (
      <div
        role="listbox"
        aria-label={t("languageSelector")}
        className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-full"
      >
        {renderLanguageOptions()}
      </div>
    );
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative inline-block"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        aria-label={t("languageSelector")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span>{currentLanguage.name}</span>
        <svg
          className={dropdownArrowStyles({ isOpen })}
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
      </button>

      {renderDropdown()}
    </div>
  );
};
