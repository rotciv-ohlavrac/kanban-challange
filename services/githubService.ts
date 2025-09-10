import {
  GitHubPR,
  PRStatus,
  PR_STATUS_CONFIG,
  PR_TO_TASK_STATUS_MAP,
  TaskStatus,
} from "../types";

// Simulação de dados de PRs do GitHub (em produção, isso viria da API do GitHub)
const mockPRs: GitHubPR[] = [
  {
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
  {
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
  {
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
];

export class GitHubService {
  private static instance: GitHubService;
  private prs: GitHubPR[] = mockPRs;

  private constructor() {}

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  // Buscar PRs disponíveis
  async searchPRs(query?: string): Promise<GitHubPR[]> {
    // Simular delay da API
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!query) {
      return this.prs;
    }

    return this.prs.filter(
      (pr) =>
        pr.title.toLowerCase().includes(query.toLowerCase()) ||
        pr.number.toString().includes(query) ||
        pr.branch.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Obter PR por número
  async getPR(number: number): Promise<GitHubPR | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.prs.find((pr) => pr.number === number) || null;
  }

  // Criar um novo PR (simulação)
  async createPR(data: {
    title: string;
    branch: string;
    repository: string;
  }): Promise<GitHubPR> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newPR: GitHubPR = {
      number: Math.max(...this.prs.map((pr) => pr.number)) + 1,
      title: data.title,
      url: `https://github.com/${data.repository}/pull/${
        Math.max(...this.prs.map((pr) => pr.number)) + 1
      }`,
      status: PRStatus.OPEN,
      author: "current-user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      branch: data.branch,
      repository: data.repository,
    };

    this.prs.push(newPR);
    return newPR;
  }

  // Atualizar status do PR
  async updatePRStatus(
    number: number,
    status: PRStatus
  ): Promise<GitHubPR | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const prIndex = this.prs.findIndex((pr) => pr.number === number);
    if (prIndex === -1) return null;

    this.prs[prIndex] = {
      ...this.prs[prIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    return this.prs[prIndex];
  }

  // Obter status do PR com cores usando enum
  getStatusColor(status: PRStatus): string {
    return PR_STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-800";
  }

  // Obter ícone do status do PR usando enum
  getStatusIcon(status: PRStatus): string {
    return PR_STATUS_CONFIG[status]?.icon || "📝";
  }

  // Sugerir movimento de tarefa baseado no status do PR usando enum
  suggestTaskStatus(prStatus: PRStatus): TaskStatus {
    return PR_TO_TASK_STATUS_MAP[prStatus] || TaskStatus.BACKLOG;
  }
}
