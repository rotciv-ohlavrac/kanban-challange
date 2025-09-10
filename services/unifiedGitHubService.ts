import { GitHubPR, PRStatus, TaskStatus } from "../types";
import { GitHubService } from "./githubService"; // Versão mock
import { GitHubApiService } from "./githubApiService"; // Versão API real
import { GITHUB_CONFIG } from "../config/github";

// Interface unificada para ambos os serviços
interface IGitHubService {
  searchPRs(query?: string): Promise<GitHubPR[]>;
  getPR(number: number): Promise<GitHubPR | null>;
  createPR?(data: any): Promise<GitHubPR>;
  getStatusColor(status: PRStatus): string;
  getStatusIcon(status: PRStatus): string;
  suggestTaskStatus(prStatus: PRStatus): TaskStatus;
}

export class UnifiedGitHubService implements IGitHubService {
  private service: IGitHubService;

  constructor() {
    if (GITHUB_CONFIG.mode === "api") {
      // Usar API real do GitHub
      this.service = GitHubApiService.getInstance({
        owner: GITHUB_CONFIG.api.owner,
        repo: GITHUB_CONFIG.api.repo,
        token: GITHUB_CONFIG.api.token,
      });
      console.log(
        "🔗 Usando GitHub API real para:",
        `${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}`
      );
    } else {
      // Usar dados simulados
      this.service = GitHubService.getInstance();
      console.log("🎭 Usando dados simulados do GitHub");
    }
  }

  async searchPRs(query?: string): Promise<GitHubPR[]> {
    return this.service.searchPRs(query);
  }

  async getPR(number: number): Promise<GitHubPR | null> {
    return this.service.getPR(number);
  }

  async createPR(data: { title: string; branch: string }): Promise<GitHubPR> {
    if (GITHUB_CONFIG.mode === "api" && "createPR" in this.service) {
      // Para API real, precisa especificar branch base
      return (this.service as GitHubApiService).createPR({
        title: data.title,
        head: data.branch,
        base: "main", // ou 'master', dependendo do seu repo
        body: `Tarefa criada via Kanban Board\n\nBranch: ${data.branch}`,
      });
    } else {
      // Para mock, usar método existente
      return (this.service as GitHubService).createPR({
        title: data.title,
        branch: data.branch,
        repository: `${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}`,
      });
    }
  }

  getStatusColor(status: PRStatus): string {
    return this.service.getStatusColor(status);
  }

  getStatusIcon(status: PRStatus): string {
    return this.service.getStatusIcon(status);
  }

  suggestTaskStatus(prStatus: PRStatus): TaskStatus {
    return this.service.suggestTaskStatus(prStatus);
  }

  // Método para verificar se está usando API real
  isUsingRealApi(): boolean {
    return GITHUB_CONFIG.mode === "api";
  }

  // Método para obter informações do repositório
  getRepositoryInfo(): { owner: string; repo: string; mode: string } {
    return {
      owner: GITHUB_CONFIG.api.owner,
      repo: GITHUB_CONFIG.api.repo,
      mode: GITHUB_CONFIG.mode,
    };
  }
}
