"use client";

import React from "react";
import { TasksProvider } from "./TasksContext";
import { UsersProvider } from "./UsersContext";
import { SprintsProvider } from "./SprintsContext";
import { SearchProvider } from "./SearchContext";

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Main application provider that combines all context providers
 * in the correct order to handle dependencies between contexts.
 *
 * Order matters:
 * 1. TasksProvider - Base tasks functionality
 * 2. UsersProvider - User management
 * 3. SprintsProvider - Depends on TasksProvider for story points calculation
 * 4. SearchProvider - Depends on TasksProvider for filtering
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <TasksProvider>
      <UsersProvider>
        <SprintsProvider>
          <SearchProvider>{children}</SearchProvider>
        </SprintsProvider>
      </UsersProvider>
    </TasksProvider>
  );
};

export default AppProvider;
