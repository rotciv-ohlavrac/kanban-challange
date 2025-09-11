"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cva } from "class-variance-authority";
import { useKanban } from "../contexts/KanbanContext";
import { Task } from "../types";
import { useScreenReaderAnnouncements } from "../hooks/useKeyboardNavigation";

interface SearchBarProps {
  onTaskSelect: (task: Task) => void;
}

// Task Status Variants
const taskStatusStyles = cva(
  ["px-2", "py-1", "text-xs", "font-medium", "rounded-full"],
  {
    variants: {
      status: {
        backlog: ["bg-slate-100", "text-slate-800"],
        "in-progress": ["bg-blue-100", "text-blue-800"],
        completed: ["bg-emerald-100", "text-emerald-800"],
      },
    },
    defaultVariants: {
      status: "backlog",
    },
  }
);

export const SearchBar: React.FC<SearchBarProps> = ({ onTaskSelect }) => {
  const t = useTranslations("kanban");
  const tA11y = useTranslations("accessibility");
  const { tasks, searchTerm, setSearchTerm } = useKanban();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { announce } = useScreenReaderAnnouncements();

  // Filtrar tarefas baseado no termo de busca
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showSuggestions =
    searchTerm.length > 0 && isOpen && filteredTasks.length > 0;

  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  // Scroll para o item selecionado quando necessário
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current && filteredTasks.length > 0) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        // Verifica se o elemento está visível no container
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
  }, [selectedIndex, filteredTasks.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTaskSelect = (task: Task) => {
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(-1);
    onTaskSelect(task);
    announce(`${tA11y("task", { title: task.title })}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTasks.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredTasks[selectedIndex]) {
          handleTaskSelect(filteredTasks[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      inputRef.current &&
      !inputRef.current.contains(e.target as Node) &&
      listRef.current &&
      !listRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusVariant = (status: Task["status"]) => {
    return status === "backlog" ||
      status === "in-progress" ||
      status === "completed"
      ? status
      : "backlog";
  };

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "backlog":
        return "Backlog";
      case "in-progress":
        return "Em andamento";
      case "completed":
        return "Concluída";
      default:
        return status;
    }
  };

  // Render functions for better performance
  const renderTasksList = () => {
    return filteredTasks.map((task, index) => (
      <li
        key={task.id}
        id={`search-result-${index}`}
        role="option"
        aria-selected={index === selectedIndex}
        onClick={() => handleTaskSelect(task)}
        className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
          index === selectedIndex
            ? "bg-blue-100 border-blue-200 text-gray-900"
            : "hover:bg-gray-50 text-gray-900"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {task.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          </div>
          <span
            className={taskStatusStyles({
              status: getStatusVariant(task.status),
            })}
          >
            {getStatusLabel(task.status)}
          </span>
        </div>
      </li>
    ));
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <ul
        ref={listRef}
        id="search-results"
        role="listbox"
        aria-label={tA11y("searchResults")}
        className="absolute z-50 w-full max-w-md mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        {renderTasksList()}
      </ul>
    );
  };

  return (
    <div className="mb-6 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length > 0 && setIsOpen(true)}
          className="w-full max-w-md px-4 py-3 pl-10 text-gray-900 bg-white border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm placeholder-gray-600"
          autoComplete="off"
          aria-label={tA11y("searchInput")}
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? "search-results" : undefined}
          aria-activedescendant={
            selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
          }
          role="combobox"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg"
          >
            <svg
              className="h-5 w-5 text-gray-400 hover:text-gray-600"
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

      {renderSuggestions()}
    </div>
  );
};
