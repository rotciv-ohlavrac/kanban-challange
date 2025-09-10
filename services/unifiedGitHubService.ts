import { GitHubPR, PRStatus, TaskStatus } from "../types";
import { GitHubService } from "./githubService"; // Versão mock
import { GitHubApiService } from "./githubApiService"; // Versão API real
import { GITHUB_CONFIG } from "../config/github";

// Interface unificada para ambos os serviços
interface IGitHubService {
  searchPRs(query?: string): Promise<GitHubPR[]>;
  getPR(number: number): Promise<GitHubPR | null>;
  createPR?(data: any): Promise<GitHubPR>;
  getBranches?(): Promise<string[]>;
  getStatusColor(status: PRStatus): string;
  getStatusIcon(status: PRStatus): string;
  suggestTaskStatus(prStatus: PRStatus): TaskStatus;
}

export class UnifiedGitHubService implements IGitHubService {
  private service: IGitHubService;
  private static instance: UnifiedGitHubService;
  private branchesCache: { data: string[]; timestamp: number } | null = null;
  private prsCache: { data: GitHubPR[]; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Debug das variáveis de ambiente
    console.log("🔍 Debug de variáveis de ambiente:");
    console.log("  - process.env.GITHUB_TOKEN:", process.env.GITHUB_TOKEN ? "DEFINIDO" : "UNDEFINED");
    console.log("  - GITHUB_CONFIG.api.token:", GITHUB_CONFIG.api.token ? "DEFINIDO" : "UNDEFINED");
    console.log("  - GITHUB_CONFIG.mode:", GITHUB_CONFIG.mode);

    if (GITHUB_CONFIG.mode === "api") {
      // Usar API real do GitHub
      this.service = GitHubApiService.getInstance({
        owner: GITHUB_CONFIG.api.owner,
        repo: GITHUB_CONFIG.api.repo,
        token: GITHUB_CONFIG.api.token,
      });
      console.log(
        "🔗 Usando GitHub API real para:",
        `${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}`,
        GITHUB_CONFIG.api.token
          ? "(autenticado ✅)"
          : "(sem token - rate limit baixo ⚠️)"
      );
    } else {
      // Usar dados simulados
      this.service = GitHubService.getInstance();
      console.log("🎭 Usando dados simulados do GitHub");
    }
  }

  // Singleton pattern para evitar múltiplas instâncias
  static getInstance(): UnifiedGitHubService {
    if (!UnifiedGitHubService.instance) {
      UnifiedGitHubService.instance = new UnifiedGitHubService();
    }
    return UnifiedGitHubService.instance;
  }

  private isCacheValid(cache: { timestamp: number } | null): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < this.CACHE_DURATION;
  }

  async searchPRs(query?: string): Promise<GitHubPR[]> {
    // Se tem query, não usar cache (busca específica)
    if (query) {
      console.log("🔍 Buscando PRs com query:", query);
      return this.service.searchPRs(query);
    }

    // Verificar cache para busca geral
    if (this.isCacheValid(this.prsCache)) {
      console.log("📦 Usando PRs do cache");
      return this.prsCache!.data;
    }

    console.log("🌐 Buscando PRs da API...");
    const prs = await this.service.searchPRs();

    // Atualizar cache
    this.prsCache = {
      data: prs,
      timestamp: Date.now(),
    };

    return prs;
  }

  async getPR(number: number): Promise<GitHubPR | null> {
    return this.service.getPR(number);
  }

  async createPR(data: { title: string; branch: string }): Promise<GitHubPR> {
    let newPR: GitHubPR;

    if (GITHUB_CONFIG.mode === "api" && "createPR" in this.service) {
      // Para API real, precisa especificar branch base
      newPR = await (this.service as GitHubApiService).createPR({
        title: data.title,
        head: data.branch,
        base: "main", // ou 'master', dependendo do seu repo
        body: `Tarefa criada via Kanban Board\n\nBranch: ${data.branch}`,
      });
    } else {
      // Para mock, usar método existente
      newPR = await (this.service as GitHubService).createPR({
        title: data.title,
        branch: data.branch,
        repository: `${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}`,
      });
    }

    // Invalidar cache de PRs após criar um novo
    console.log("🗑️ Invalidando cache de PRs após criação");
    this.prsCache = null;

    return newPR;
  }

  async getBranches(): Promise<string[]> {
    // Verificar cache primeiro
    if (this.isCacheValid(this.branchesCache)) {
      console.log("📦 Usando branches do cache");
      return this.branchesCache!.data;
    }

    console.log("🌐 Buscando branches da API...");

    if (
      "getBranches" in this.service &&
      typeof (this.service as any).getBranches === "function"
    ) {
      const branches = await (this.service as any).getBranches();

      // Atualizar cache
      this.branchesCache = {
        data: branches,
        timestamp: Date.now(),
      };

      return branches;
    }

    // Fallback para branches padrão
    const fallbackBranches = ["main", "develop"];
    this.branchesCache = {
      data: fallbackBranches,
      timestamp: Date.now(),
    };

    return fallbackBranches;
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

  // Verificar rate limit (apenas para API real)
  async checkRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  } | null> {
    if (GITHUB_CONFIG.mode !== "api" || !("checkRateLimit" in this.service)) {
      return null;
    }

    try {
      return await (this.service as GitHubApiService).checkRateLimit();
    } catch (error) {
      console.error("Erro ao verificar rate limit:", error);
      return null;
    }
  }

  // Invalidar todos os caches manualmente
  clearCache(): void {
    console.log("🗑️ Limpando todos os caches");
    this.prsCache = null;
    this.branchesCache = null;
  }
}
