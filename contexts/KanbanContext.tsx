"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Task,
  KanbanContextType,
  TaskStatus,
  PRStatus,
  Sprint,
  User,
} from "../types";
import { calculateWorkingDays, addWorkingDays } from "../utils/dateUtils";

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

// Dados iniciais de usuários
const initialUsers: User[] = [
  {
    id: uuidv4(),
    name: "Ana Silva",
    email: "ana.silva@example.com",
    role: "developer",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: uuidv4(),
    name: "Carlos Santos",
    email: "carlos.santos@example.com",
    role: "designer",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: uuidv4(),
    name: "Maria Costa",
    email: "maria.costa@example.com",
    role: "pm",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: uuidv4(),
    name: "João Oliveira",
    email: "joao.oliveira@example.com",
    role: "qa",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
];

// Sprint inicial
const initialSprints: Sprint[] = [
  {
    id: uuidv4(),
    name: "Sprint 1 - Setup Inicial",
    description: "Configuração inicial do projeto e funcionalidades básicas",
    startDate: new Date("2024-01-15"),
    endDate: addWorkingDays(new Date("2024-01-15"), 5),
    workingDays: 5,
    status: "active",
    totalStoryPoints: 0, // Será calculado
    completedStoryPoints: 0, // Será calculado
    tasks: [], // Será populado
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

// Dados iniciais de exemplo
const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: "Configurar ambiente de desenvolvimento",
    description:
      "Instalar dependências e configurar o projeto React com TypeScript",
    status: TaskStatus.COMPLETED,
    storyPoints: 3,
    assignedTo: initialUsers[0], // Ana Silva
    sprintId: initialSprints[0].id,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    completedAt: new Date("2024-01-15"),
  },
  {
    id: uuidv4(),
    title: "Implementar drag & drop",
    description:
      "Adicionar funcionalidade de arrastar e soltar tarefas entre colunas",
    status: TaskStatus.IN_PROGRESS,
    storyPoints: 8,
    assignedTo: initialUsers[0], // Ana Silva
    sprintId: initialSprints[0].id,
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
    githubPR: {
      number: 123,
      title: "feat: implement drag & drop functionality",
      url: "https://github.com/user/repo/pull/123",
      status: PRStatus.MERGED,
      author: "developer1",
      createdAt: "2024-01-16T10:00:00Z",
      updatedAt: "2024-01-16T15:30:00Z",
      branch: "feature/drag-drop",
      repository: "user/kanban-project",
    },
  },
  {
    id: uuidv4(),
    title: "Criar sistema de busca",
    description: "Implementar busca por título das tarefas",
    status: TaskStatus.BACKLOG,
    storyPoints: 5,
    assignedTo: initialUsers[1], // Carlos Santos
    sprintId: initialSprints[0].id,
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
    githubPR: {
      number: 124,
      title: "feat: add search functionality",
      url: "https://github.com/user/repo/pull/124",
      status: PRStatus.OPEN,
      author: "developer2",
      createdAt: "2024-01-17T09:00:00Z",
      updatedAt: "2024-01-17T14:20:00Z",
      branch: "feature/search",
      repository: "user/kanban-project",
    },
  },
  {
    id: uuidv4(),
    title: "Aplicar tema Twilio Paste",
    description: "Estilizar o Kanban com o design system do Twilio Paste",
    status: TaskStatus.BACKLOG,
    storyPoints: 2,
    assignedTo: initialUsers[1], // Carlos Santos (Designer)
    sprintId: initialSprints[0].id,
    createdAt: new Date("2024-01-17"),
    updatedAt: new Date("2024-01-17"),
    githubPR: {
      number: 125,
      title: "style: apply Twilio Paste theme",
      url: "https://github.com/user/repo/pull/125",
      status: PRStatus.OPEN,
      author: "developer1",
      createdAt: "2024-01-17T11:00:00Z",
      updatedAt: "2024-01-17T16:45:00Z",
      branch: "style/twilio-paste",
      repository: "user/kanban-project",
    },
  },
];

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [currentSprint, setCurrentSprintState] = useState<Sprint | null>(
    initialSprints[0]
  );
  const [users, setUsers] = useState<User[]>(initialUsers);

  const addTask = useCallback(
    (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks((prev) => [...prev, newTask]);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const finalUpdates = { ...updates, updatedAt: new Date() };

          // Handle completedAt logic if status is being updated
          if (updates.status !== undefined) {
            if (
              updates.status === TaskStatus.COMPLETED &&
              task.status !== TaskStatus.COMPLETED
            ) {
              // Only set completedAt if it's not already provided in updates
              if (!updates.completedAt) {
                finalUpdates.completedAt = new Date();
              }
            } else if (updates.status !== TaskStatus.COMPLETED) {
              // Clear completedAt if task is moved away from completed
              // Only if completedAt is not explicitly provided in updates
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
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updates: Partial<Task> = {
            status: newStatus,
            updatedAt: new Date(),
          };

          // Set completedAt when task is moved to completed
          if (
            newStatus === TaskStatus.COMPLETED &&
            task.status !== TaskStatus.COMPLETED
          ) {
            updates.completedAt = new Date();
          } else if (newStatus !== TaskStatus.COMPLETED) {
            // Clear completedAt if task is moved away from completed
            updates.completedAt = undefined;
          }

          return { ...task, ...updates };
        }
        return task;
      })
    );
  }, []);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  // Sprint methods
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
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((sprint) => sprint.id !== id));
    // Remove sprint reference from tasks
    setTasks((prev) =>
      prev.map((task) =>
        task.sprintId === id ? { ...task, sprintId: undefined } : task
      )
    );
  }, []);

  const setCurrentSprint = useCallback(
    (sprintId: string | null) => {
      const sprint = sprintId ? sprints.find((s) => s.id === sprintId) : null;
      setCurrentSprintState(sprint || null);
    },
    [sprints]
  );

  // User methods
  const addUser = useCallback((userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    // Remove user assignment from tasks
    setTasks((prev) =>
      prev.map((task) =>
        task.assignedTo?.id === id ? { ...task, assignedTo: undefined } : task
      )
    );
  }, []);

  const value: KanbanContextType = useMemo(
    () => ({
      // Tasks
      tasks,
      searchTerm,
      setSearchTerm,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      getTasksByStatus,

      // Sprints
      sprints,
      currentSprint,
      addSprint,
      updateSprint,
      deleteSprint,
      setCurrentSprint,

      // Users
      users,
      addUser,
      updateUser,
      deleteUser,
    }),
    [
      tasks,
      searchTerm,
      setSearchTerm,
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      getTasksByStatus,
      sprints,
      currentSprint,
      addSprint,
      updateSprint,
      deleteSprint,
      setCurrentSprint,
      users,
      addUser,
      updateUser,
      deleteUser,
    ]
  );

  return (
    <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
  );
};

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
};
