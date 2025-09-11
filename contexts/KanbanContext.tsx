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
import { Task, KanbanContextType, TaskStatus, Sprint, User } from "../types";
import { calculateWorkingDays, addWorkingDays } from "../utils/dateUtils";
import { indexedDBService } from "../services/indexedDbService";
import { gitHubUsersService } from "../services/githubUsersService";

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Estados principais
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprintState] = useState<Sprint | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização do IndexedDB e carregamento dos dados
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("🚀 Inicializando aplicação...");
        setIsLoading(true);

        // Inicializar IndexedDB
        await indexedDBService.init();

        // Carregar dados salvos
        const [savedTasks, savedUsers, savedSprints] = await Promise.all([
          indexedDBService.getTasks(),
          indexedDBService.getUsers(),
          indexedDBService.getSprints(),
        ]);

        // Se não há usuários salvos, buscar da API do GitHub
        if (savedUsers.length === 0) {
          console.log("👥 Nenhum usuário encontrado, buscando do GitHub...");
          try {
            const githubUsers = await gitHubUsersService.getAllUsers();
            if (githubUsers.length > 0) {
              await indexedDBService.saveUsers(githubUsers);
              setUsers(githubUsers);
            } else {
              console.log("⚠️ Nenhum usuário encontrado no GitHub");
            }
          } catch (error) {
            console.error("❌ Erro ao buscar usuários do GitHub:", error);
          }
        } else {
          setUsers(savedUsers);
        }

        // Se não há sprints, criar um sprint padrão
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
          // Definir sprint ativo como atual
          const activeSprint = savedSprints.find((s) => s.status === "active");
          setCurrentSprintState(activeSprint || savedSprints[0] || null);
        }

        // Carregar tarefas
        setTasks(savedTasks);

        console.log("✅ Aplicação inicializada com sucesso");
        console.log(
          `📊 Dados carregados: ${savedTasks.length} tarefas, ${savedUsers.length} usuários, ${savedSprints.length} sprints`
        );
      } catch (error) {
        console.error("❌ Erro ao inicializar aplicação:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Salvar tarefas no IndexedDB sempre que mudarem
  useEffect(() => {
    if (!isLoading && tasks.length >= 0) {
      indexedDBService.saveTasks(tasks).catch(console.error);
    }
  }, [tasks, isLoading]);

  // Salvar usuários no IndexedDB sempre que mudarem
  useEffect(() => {
    if (!isLoading && users.length >= 0) {
      indexedDBService.saveUsers(users).catch(console.error);
    }
  }, [users, isLoading]);

  // Salvar sprints no IndexedDB sempre que mudarem
  useEffect(() => {
    if (!isLoading && sprints.length >= 0) {
      indexedDBService.saveSprints(sprints).catch(console.error);
    }
  }, [sprints, isLoading]);

  // Funções de gerenciamento de tarefas
  const addTask = useCallback(
    (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
      const newTask: Task = {
        ...taskData,
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setTasks((prev) => [...prev, newTask]);

      // Atualizar sprint se tarefa foi atribuída a um
      if (newTask.sprintId) {
        updateSprintStoryPoints(newTask.sprintId);
      }

      console.log(`✅ Tarefa "${newTask.title}" criada`);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const finalUpdates = { ...updates, updatedAt: new Date() };

          // Gerenciar completedAt quando status muda
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

          const updatedTask = { ...task, ...finalUpdates };

          // Atualizar sprint se necessário
          if (updatedTask.sprintId) {
            setTimeout(() => updateSprintStoryPoints(updatedTask.sprintId!), 0);
          }

          return updatedTask;
        }
        return task;
      })
    );

    console.log(`📝 Tarefa ${id} atualizada`);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const taskToDelete = prev.find((task) => task.id === id);
      if (taskToDelete?.sprintId) {
        setTimeout(() => updateSprintStoryPoints(taskToDelete.sprintId!), 0);
      }
      return prev.filter((task) => task.id !== id);
    });

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

          // Gerenciar completedAt
          if (
            newStatus === TaskStatus.COMPLETED &&
            task.status !== TaskStatus.COMPLETED
          ) {
            updates.completedAt = new Date();
          } else if (newStatus !== TaskStatus.COMPLETED) {
            updates.completedAt = undefined;
          }

          const updatedTask = { ...task, ...updates };

          // Atualizar sprint
          if (updatedTask.sprintId) {
            setTimeout(() => updateSprintStoryPoints(updatedTask.sprintId!), 0);
          }

          return updatedTask;
        }
        return task;
      })
    );

    console.log(`🔄 Tarefa ${taskId} movida para ${newStatus}`);
  }, []);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  // Funções de gerenciamento de usuários
  const addUser = useCallback((userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
    };

    setUsers((prev) => [...prev, newUser]);
    console.log(`👤 Usuário "${newUser.name}" adicionado`);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
    console.log(`📝 Usuário ${id} atualizado`);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    console.log(`🗑️ Usuário ${id} removido`);
  }, []);

  // Funções de gerenciamento de sprints
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

    // Remover sprintId das tarefas associadas
    setTasks((prev) =>
      prev.map((task) =>
        task.sprintId === id ? { ...task, sprintId: undefined } : task
      )
    );

    console.log(`🗑️ Sprint ${id} removido`);
  }, []);

  const setCurrentSprint = useCallback(
    (sprintId: string | null) => {
      const sprint = sprintId ? sprints.find((s) => s.id === sprintId) : null;
      setCurrentSprintState(sprint || null);
    },
    [sprints]
  );

  // Função auxiliar para atualizar story points do sprint
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

  // Tarefas filtradas
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

  // Valor do contexto
  const contextValue: KanbanContextType = {
    // Tasks
    tasks: filteredTasks,
    searchTerm,
    setSearchTerm,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByStatus,

    // Users
    users,
    addUser,
    updateUser,
    deleteUser,

    // Sprints
    sprints,
    currentSprint,
    addSprint,
    updateSprint,
    deleteSprint,
    setCurrentSprint,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <KanbanContext.Provider value={contextValue}>
      {children}
    </KanbanContext.Provider>
  );
};

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
};
