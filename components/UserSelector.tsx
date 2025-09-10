"use client";

import React, { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { User } from "../types";
import { useKanban } from "../contexts/KanbanContext";
import { useFocusManagement } from "../hooks/useKeyboardNavigation";

interface UserSelectorProps {
  selectedUser?: User;
  onUserSelect: (user: User | undefined) => void;
  placeholder?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  selectedUser,
  onUserSelect,
  placeholder,
}) => {
  const t = useTranslations("user");
  const { users } = useKanban();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { containerRef } = useFocusManagement();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleUserSelect = (user: User | undefined) => {
    onUserSelect(user);
    setIsOpen(false);
    setSelectedIndex(-1);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex(
          (prev) => (prev < users.length ? prev + 1 : 0) // Include "unassign" option
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : users.length));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (selectedIndex === 0) {
          handleUserSelect(undefined); // Unassign
        } else if (selectedIndex > 0) {
          handleUserSelect(users[selectedIndex - 1]);
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
      setSelectedIndex(
        selectedUser ? users.findIndex((u) => u.id === selectedUser.id) + 1 : 0
      );
    }
  };

  const handleBlur = (event: React.FocusEvent) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node)) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "developer":
        return "bg-blue-100 text-blue-800";
      case "designer":
        return "bg-purple-100 text-purple-800";
      case "pm":
        return "bg-green-100 text-green-800";
      case "qa":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        aria-label={t("selectUser")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-900 bg-white border border-gray-400 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
      >
        {selectedUser ? (
          <div className="flex items-center gap-2">
            {selectedUser.avatar && (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium">{selectedUser.name}</span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
                selectedUser.role
              )}`}
            >
              {t(`roles.${selectedUser.role}`)}
            </span>
          </div>
        ) : (
          <span className="text-gray-600">
            {placeholder || t("selectUser")}
          </span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
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

      {isOpen && (
        <div
          role="listbox"
          aria-label={t("selectUser")}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Unassign option */}
          <button
            role="option"
            aria-selected={selectedIndex === 0}
            onClick={() => handleUserSelect(undefined)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
              selectedIndex === 0 ? "bg-gray-50" : ""
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-gray-500"
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
            </div>
            <span className="text-gray-600">{t("unassign")}</span>
          </button>

          {users.map((user, index) => (
            <button
              key={user.id}
              role="option"
              aria-selected={selectedIndex === index + 1}
              onClick={() => handleUserSelect(user)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                selectedIndex === index + 1 ? "bg-gray-50" : ""
              } ${
                selectedUser?.id === user.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-900"
              }`}
            >
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
                  user.role
                )}`}
              >
                {t(`roles.${user.role}`)}
              </span>
              {selectedUser?.id === user.id && (
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}

          {users.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              {t("noUsers")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
