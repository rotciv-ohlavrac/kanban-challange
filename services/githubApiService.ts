import {
  GitHubPR,
  PRStatus,
  PR_STATUS_CONFIG,
  PR_TO_TASK_STATUS_MAP,
  TaskStatus,
} from "../types";

// Tipos para a API do GitHub
interface GitHubApiPR {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  merged_at: string | null;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
  };
}

interface GitHubApiConfig {
  owner: string; // Nome do usuário ou organização (ex: "facebook")
  repo: string; // Nome do repositório (ex: "react")
  token?: string; // Token de acesso pessoal do GitHub (opcional, mas recomendado)
}

export class GitHubApiService {
  private static instance: GitHubApiService;
  private config: GitHubApiConfig;
  private baseUrl = "https://api.github.com";

  private constructor(config: GitHubApiConfig) {
    this.config = config;
  }

  public static getInstance(config?: GitHubApiConfig): GitHubApiService {
    if (!GitHubApiService.instance && config) {
      GitHubApiService.instance = new GitHubApiService(config);
    }
    return GitHubApiService.instance;
  }

  // Configurar headers para requisições
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // Adicionar token se disponível (para evitar rate limits)
    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  // Converter resposta da API do GitHub para nosso formato
  private mapGitHubPRToLocal(pr: GitHubApiPR): GitHubPR {
    return {
      number: pr.number,
      title: pr.title,
      url: pr.html_url, // URL real do PR no GitHub
      status:
        pr.state === "open"
          ? PRStatus.OPEN
          : pr.merged_at
          ? PRStatus.MERGED
          : PRStatus.CLOSED,
      author: pr.user.login,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      branch: pr.head.ref,
      repository: `${this.config.owner}/${this.config.repo}`,
    };
  }

  // Buscar PRs do repositório
  async searchPRs(
    query?: string,
    state: "open" | "closed" | "all" = "all"
  ): Promise<GitHubPR[]> {
    try {
      let url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls?state=${state}&per_page=50`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `GitHub API Error: ${response.status} ${response.statusText}`
        );
      }

      const prs: GitHubApiPR[] = await response.json();
      let mappedPRs = prs.map(this.mapGitHubPRToLocal.bind(this));

      // Filtrar por query se fornecida
      if (query) {
        const queryLower = query.toLowerCase();
        mappedPRs = mappedPRs.filter(
          (pr) =>
            pr.title.toLowerCase().includes(queryLower) ||
            pr.number.toString().includes(query) ||
            pr.branch.toLowerCase().includes(queryLower) ||
            pr.author.toLowerCase().includes(queryLower)
        );
      }

      return mappedPRs;
    } catch (error) {
      console.error("Erro ao buscar PRs:", error);
      throw error;
    }
  }

  // Obter PR específico por número
  async getPR(number: number): Promise<GitHubPR | null> {
    try {
      const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${number}`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // PR não encontrado
        }
        throw new Error(
          `GitHub API Error: ${response.status} ${response.statusText}`
        );
      }

      const pr: GitHubApiPR = await response.json();
      return this.mapGitHubPRToLocal(pr);
    } catch (error) {
      console.error(`Erro ao obter PR #${number}:`, error);
      return null;
    }
  }

  // Criar um novo PR (requer token com permissões)
  async createPR(data: {
    title: string;
    head: string; // branch de origem
    base: string; // branch de destino (ex: "main")
    body?: string;
  }): Promise<GitHubPR> {
    try {
      if (!this.config.token) {
        throw new Error("Token de acesso é necessário para criar PRs");
      }

      const url = `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/pulls`;

      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: data.title,
          head: data.head,
          base: data.base,
          body: data.body || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Erro ao criar PR: ${error.message || response.statusText}`
        );
      }

      const pr: GitHubApiPR = await response.json();
      return this.mapGitHubPRToLocal(pr);
    } catch (error) {
      console.error("Erro ao criar PR:", error);
      throw error;
    }
  }

  // Verificar rate limit atual
  async checkRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/rate_limit`, {
        headers: this.getHeaders(),
      });

      const data = await response.json();
      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        reset: new Date(data.rate.reset * 1000),
      };
    } catch (error) {
      console.error("Erro ao verificar rate limit:", error);
      throw error;
    }
  }

  // Utilitários usando enums
  getStatusColor(status: PRStatus): string {
    return PR_STATUS_CONFIG[status]?.color || "bg-gray-100 text-gray-800";
  }

  getStatusIcon(status: PRStatus): string {
    return PR_STATUS_CONFIG[status]?.icon || "📝";
  }

  suggestTaskStatus(prStatus: PRStatus): TaskStatus {
    return PR_TO_TASK_STATUS_MAP[prStatus] || TaskStatus.BACKLOG;
  }
}
