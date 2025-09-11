"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { Task, TaskStatus } from "../types";
import { indexedDBService } from "../services/indexedDbService";

interface TasksContextType {
  // State
  tasks: Task[];
  isLoading: boolean;

  // Actions
  addTask: (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;

  // Selectors
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksBySprint: (sprintId: string) => Task[];
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize tasks from IndexedDB
  useEffect(() => {
    const initializeTasks = async () => {
      try {
        setIsLoading(true);
        await indexedDBService.init();
        const savedTasks = await indexedDBService.getTasks();
        setTasks(savedTasks);
      } catch (error) {
        console.error("❌ Erro ao carregar tarefas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTasks();
  }, []);

  // Save tasks to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      indexedDBService.saveTasks(tasks).catch(console.error);
    }
  }, [tasks, isLoading]);

  // Task management functions
  const addTask = useCallback(
    (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setTasks((prev) => [...prev, newTask]);
      console.log(`✅ Tarefa "${newTask.title}" criada`);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const finalUpdates = { ...updates, updatedAt: new Date() };

          // Manage completedAt when status changes
          if (updates.status !== undefined) {
            if (
              updates.status === TaskStatus.COMPLETED &&
              task.status !== TaskStatus.COMPLETED
            ) {
              if (!updates.completedAt) {
                finalUpdates.completedAt = new Date();
              }
            } else if (updates.status !== TaskStatus.COMPLETED) {
              if (updates.completedAt === undefined) {
                finalUpdates.completedAt = undefined;
              }
            }
          }

          return { ...task, ...finalUpdates };
        }
        return task;
      })
    );

    console.log(`📝 Tarefa ${id} atualizada`);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    indexedDBService.deleteTask(id).catch(console.error);
    console.log(`🗑️ Tarefa ${id} removida`);
  }, []);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updates: Partial<Task> = {
            status: newStatus,
            updatedAt: new Date(),
          };

          // Manage completedAt
          if (
            newStatus === TaskStatus.COMPLETED &&
            task.status !== TaskStatus.COMPLETED
          ) {
            updates.completedAt = new Date();
          } else if (newStatus !== TaskStatus.COMPLETED) {
            updates.completedAt = undefined;
          }

          return { ...task, ...updates };
        }
        return task;
      })
    );

    console.log(`🔄 Tarefa ${taskId} movida para ${newStatus}`);
  }, []);

  // Selectors
  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  const getTasksBySprint = useCallback(
    (sprintId: string) => {
      return tasks.filter((task) => task.sprintId === sprintId);
    },
    [tasks]
  );

  const contextValue: TasksContextType = {
    // State
    tasks,
    isLoading,

    // Actions
    addTask,
    updateTask,
    deleteTask,
    moveTask,

    // Selectors
    getTasksByStatus,
    getTasksBySprint,
  };

  return (
    <TasksContext.Provider value={contextValue}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
};

export default TasksProvider;
