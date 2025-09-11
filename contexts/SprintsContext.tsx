"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { Sprint, TaskStatus } from "../types";
import { addWorkingDays } from "../utils/dateUtils";
import { indexedDBService } from "../services/indexedDbService";
import { useTasks } from "./TasksContext";

interface SprintsContextType {
  // State
  sprints: Sprint[];
  currentSprint: Sprint | null;
  isLoading: boolean;

  // Actions
  addSprint: (
    sprintData: Omit<
      Sprint,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "tasks"
      | "totalStoryPoints"
      | "completedStoryPoints"
    >
  ) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  setCurrentSprint: (sprintId: string | null) => void;
  updateSprintStoryPoints: (sprintId: string) => void;
}

const SprintsContext = createContext<SprintsContextType | undefined>(undefined);

export const SprintsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprintState] = useState<Sprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { tasks } = useTasks();

  // Initialize sprints from IndexedDB
  useEffect(() => {
    const initializeSprints = async () => {
      try {
        setIsLoading(true);
        await indexedDBService.init();
        const savedSprints = await indexedDBService.getSprints();

        if (savedSprints.length === 0) {
          console.log("🏃 Criando sprint inicial...");
          const defaultSprint: Sprint = {
            id: uuidv4(),
            name: "Sprint Inicial",
            description: "Sprint padrão para organização das tarefas",
            startDate: new Date(),
            endDate: addWorkingDays(new Date(), 10),
            workingDays: 10,
            status: "active",
            totalStoryPoints: 0,
            completedStoryPoints: 0,
            tasks: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await indexedDBService.saveSprint(defaultSprint);
          setSprints([defaultSprint]);
          setCurrentSprintState(defaultSprint);
        } else {
          setSprints(savedSprints);
          // Set active sprint as current
          const activeSprint = savedSprints.find((s) => s.status === "active");
          setCurrentSprintState(activeSprint || savedSprints[0] || null);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar sprints:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSprints();
  }, []);

  // Save sprints to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading && sprints.length >= 0) {
      indexedDBService.saveSprints(sprints).catch(console.error);
    }
  }, [sprints, isLoading]);

  // Sprint management functions
  const addSprint = useCallback(
    (
      sprintData: Omit<
        Sprint,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "tasks"
        | "totalStoryPoints"
        | "completedStoryPoints"
      >
    ) => {
      const newSprint: Sprint = {
        ...sprintData,
        id: uuidv4(),
        tasks: [],
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setSprints((prev) => [...prev, newSprint]);
      console.log(`🏃 Sprint "${newSprint.name}" criado`);
    },
    []
  );

  const updateSprint = useCallback((id: string, updates: Partial<Sprint>) => {
    setSprints((prev) =>
      prev.map((sprint) =>
        sprint.id === id
          ? { ...sprint, ...updates, updatedAt: new Date() }
          : sprint
      )
    );
    console.log(`📝 Sprint ${id} atualizado`);
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((sprint) => sprint.id !== id));
    console.log(`🗑️ Sprint ${id} removido`);
  }, []);

  const setCurrentSprint = useCallback(
    (sprintId: string | null) => {
      const sprint = sprintId ? sprints.find((s) => s.id === sprintId) : null;
      setCurrentSprintState(sprint || null);
    },
    [sprints]
  );

  // Update sprint story points based on tasks
  const updateSprintStoryPoints = useCallback(
    (sprintId: string) => {
      setSprints((prev) =>
        prev.map((sprint) => {
          if (sprint.id === sprintId) {
            const sprintTasks = tasks.filter(
              (task) => task.sprintId === sprintId
            );
            const totalStoryPoints = sprintTasks.reduce(
              (sum, task) => sum + task.storyPoints,
              0
            );
            const completedStoryPoints = sprintTasks
              .filter((task) => task.status === TaskStatus.COMPLETED)
              .reduce((sum, task) => sum + task.storyPoints, 0);

            return {
              ...sprint,
              totalStoryPoints,
              completedStoryPoints,
              tasks: sprintTasks.map((task) => task.id),
              updatedAt: new Date(),
            };
          }
          return sprint;
        })
      );
    },
    [tasks]
  );

  const contextValue: SprintsContextType = {
    // State
    sprints,
    currentSprint,
    isLoading,

    // Actions
    addSprint,
    updateSprint,
    deleteSprint,
    setCurrentSprint,
    updateSprintStoryPoints,
  };

  return (
    <SprintsContext.Provider value={contextValue}>
      {children}
    </SprintsContext.Provider>
  );
};

export const useSprints = () => {
  const context = useContext(SprintsContext);
  if (context === undefined) {
    throw new Error("useSprints must be used within a SprintsProvider");
  }
  return context;
};

export default SprintsProvider;
