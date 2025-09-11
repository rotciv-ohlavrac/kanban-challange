// Enums para melhor organização e type safety
export enum PRStatus {
  OPEN = "open",
  CLOSED = "closed",
  MERGED = "merged",
}

export enum TaskStatus {
  BACKLOG = "backlog",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
}

// Mapeamentos para UI
export const PR_STATUS_CONFIG = {
  [PRStatus.OPEN]: {
    color: "bg-green-100 text-green-800",
    icon: "🔄",
    label: "Open",
  },
  [PRStatus.MERGED]: {
    color: "bg-purple-100 text-purple-800",
    icon: "✅",
    label: "Merged",
  },
  [PRStatus.CLOSED]: {
    color: "bg-red-100 text-red-800",
    icon: "❌",
    label: "Closed",
  },
} as const;

export const TASK_STATUS_CONFIG = {
  [TaskStatus.BACKLOG]: {
    label: "Backlog",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "Em andamento",
  },
  [TaskStatus.COMPLETED]: {
    label: "Concluída",
  },
} as const;

// Mapeamento de status de PR para status de tarefa
export const PR_TO_TASK_STATUS_MAP = {
  [PRStatus.OPEN]: TaskStatus.IN_PROGRESS,
  [PRStatus.MERGED]: TaskStatus.COMPLETED,
  [PRStatus.CLOSED]: TaskStatus.BACKLOG,
} as const;

export interface GitHubPR {
  number: number;
  title: string;
  url: string;
  status: PRStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
  branch: string;
  repository: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "developer" | "designer" | "pm" | "qa";
  // Campos específicos do GitHub
  login?: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  githubUrl?: string;
  contributions?: number;
}

export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  workingDays: number; // 5 dias úteis por padrão
  status: "planning" | "active" | "completed";
  totalStoryPoints: number;
  completedStoryPoints: number;
  tasks: string[]; // IDs das tarefas
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  storyPoints: number; // Story points da tarefa
  assignedTo?: User; // Usuário atribuído
  sprintId?: string; // ID do sprint
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // Data de conclusão para burndown
  githubPR?: GitHubPR;
}

export interface Column {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: Task[];
}

export interface KanbanContextType {
  // Tasks
  tasks: Task[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];

  // Sprints
  sprints: Sprint[];
  currentSprint: Sprint | null;
  addSprint: (
    sprint: Omit<
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

  // Users
  users: User[];
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}
