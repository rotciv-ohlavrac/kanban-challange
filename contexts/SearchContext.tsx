"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { Task } from "../types";
import { useTasks } from "./TasksContext";

interface SearchContextType {
  // State
  searchTerm: string;
  filteredTasks: Task[];

  // Actions
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { tasks } = useTasks();

  // Filtered tasks based on search term
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;

    const term = searchTerm.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.assignedTo?.name.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  const contextValue: SearchContextType = {
    // State
    searchTerm,
    filteredTasks,

    // Actions
    setSearchTerm,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export default SearchProvider;
