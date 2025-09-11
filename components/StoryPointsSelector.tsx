"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

interface StoryPointsSelectorProps {
  value: number;
  onChange: (points: number) => void;
  disabled?: boolean;
}

const STORY_POINTS_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21];

export const StoryPointsSelector: React.FC<StoryPointsSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const t = useTranslations("storyPoints");
  const [isOpen, setIsOpen] = useState(false);

  const handlePointSelect = (points: number) => {
    onChange(points);
    setIsOpen(false);
  };

  const getPointsColor = (points: number) => {
    if (points === 0) return "bg-gray-100 text-gray-800";
    if (points <= 3) return "bg-green-100 text-green-800";
    if (points <= 8) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPointsSize = (points: number) => {
    if (points === 0) return "text-xs";
    if (points <= 3) return "text-sm";
    if (points <= 8) return "text-base";
    return "text-lg font-bold";
  };

  // Render functions for better performance
  const renderPointsOptions = () => {
    return STORY_POINTS_OPTIONS.map((points) => (
      <button
        key={points}
        role="option"
        aria-selected={value === points}
        onClick={() => handlePointSelect(points)}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
          ${getPointsColor(points)}
          ${
            value === points
              ? "ring-2 ring-blue-500 ring-offset-1"
              : "hover:ring-1 hover:ring-gray-300"
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-all duration-200
        `}
      >
        {points || "?"}
      </button>
    ));
  };

  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    return (
      <>
        <div
          role="listbox"
          aria-label={t("estimate")}
          className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 min-w-max"
        >
          {renderPointsOptions()}
        </div>
        {/* Click outside to close */}
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label={`${t("estimate")}: ${value} ${t("points")}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-dashed
          ${getPointsColor(value)} ${getPointsSize(value)}
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-solid hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          }
          transition-all duration-200
        `}
      >
        {value || "?"}
      </button>

      {renderDropdown()}
    </div>
  );
};
