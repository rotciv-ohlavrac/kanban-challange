/**
 * Serviço para buscar usuários reais da API do GitHub
 */

import { User } from "@/types";
import { GITHUB_CONFIG } from "@/config/github";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  html_url: string;
}

interface GitHubContributor extends GitHubUser {
  contributions: number;
}

class GitHubUsersService {
  private baseUrl = "https://api.github.com";
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Kanban-App",
    };

    // Adicionar token se disponível
    if (GITHUB_CONFIG.api.token) {
      this.headers["Authorization"] = `Bearer ${GITHUB_CONFIG.api.token}`;
    }
  }

  /**
   * Busca colaboradores do repositório
   */
  async getRepositoryContributors(): Promise<User[]> {
    try {
      const url = `${this.baseUrl}/repos/${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}/contributors`;
      console.log("🔍 Buscando colaboradores do repositório...");

      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        console.warn(
          "Erro ao buscar colaboradores:",
          response.status,
          response.statusText
        );
        return [];
      }

      const contributors: GitHubContributor[] = await response.json();

      // Buscar detalhes completos de cada colaborador
      const users = await Promise.all(
        contributors.slice(0, 10).map(async (contributor) => {
          // Limitar a 10 para evitar rate limit
          const userDetails = await this.getUserDetails(contributor.login);
          return this.mapGitHubUserToUser(
            userDetails || contributor,
            contributor.contributions
          );
        })
      );

      console.log(`✅ ${users.length} colaboradores encontrados`);
      return users.filter((user) => user !== null);
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
      return [];
    }
  }

  /**
   * Busca detalhes completos de um usuário específico
   */
  async getUserDetails(username: string): Promise<GitHubUser | null> {
    try {
      const url = `${this.baseUrl}/users/${username}`;
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        console.warn(`Erro ao buscar usuário ${username}:`, response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao buscar detalhes do usuário ${username}:`, error);
      return null;
    }
  }

  /**
   * Busca usuários que fizeram commits recentes
   */
  async getRecentCommitters(since?: string): Promise<User[]> {
    try {
      const sinceParam =
        since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Últimos 30 dias
      const url = `${this.baseUrl}/repos/${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}/commits?since=${sinceParam}&per_page=50`;

      console.log("🔍 Buscando commits recentes...");

      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        console.warn("Erro ao buscar commits:", response.status);
        return [];
      }

      const commits = await response.json();

      // Extrair autores únicos
      const uniqueAuthors = new Map<string, GitHubUser>();

      for (const commit of commits) {
        if (commit.author && commit.author.login) {
          const author = commit.author;
          if (!uniqueAuthors.has(author.login)) {
            uniqueAuthors.set(author.login, author);
          }
        }
      }

      // Buscar detalhes completos dos autores
      const users = await Promise.all(
        Array.from(uniqueAuthors.values())
          .slice(0, 10)
          .map(async (author) => {
            const userDetails = await this.getUserDetails(author.login);
            return this.mapGitHubUserToUser(userDetails || author);
          })
      );

      console.log(`✅ ${users.length} committers encontrados`);
      return users.filter((user) => user !== null);
    } catch (error) {
      console.error("Erro ao buscar commits recentes:", error);
      return [];
    }
  }

  /**
   * Busca usuários por nome/login
   */
  async searchUsers(query: string): Promise<User[]> {
    try {
      const url = `${this.baseUrl}/search/users?q=${encodeURIComponent(
        query
      )}+repo:${GITHUB_CONFIG.api.owner}/${GITHUB_CONFIG.api.repo}&per_page=10`;

      console.log(`🔍 Buscando usuários com query: "${query}"`);

      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        console.warn("Erro ao buscar usuários:", response.status);
        return [];
      }

      const searchResult = await response.json();
      const users = searchResult.items || [];

      // Buscar detalhes completos dos usuários encontrados
      const detailedUsers = await Promise.all(
        users.slice(0, 5).map(async (user: GitHubUser) => {
          const userDetails = await this.getUserDetails(user.login);
          return this.mapGitHubUserToUser(userDetails || user);
        })
      );

      console.log(`✅ ${detailedUsers.length} usuários encontrados na busca`);
      return detailedUsers.filter((user) => user !== null);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
    }
  }

  /**
   * Converte GitHubUser para User
   */
  private mapGitHubUserToUser(
    githubUser: GitHubUser,
    contributions?: number
  ): User {
    // Determinar role baseado em contribuições ou outros fatores
    let role: User["role"] = "developer";

    if (contributions && contributions > 50) {
      role = "pm"; // Product Manager para grandes contribuidores
    } else if (
      githubUser.bio &&
      githubUser.bio.toLowerCase().includes("design")
    ) {
      role = "designer";
    } else if (githubUser.bio && githubUser.bio.toLowerCase().includes("qa")) {
      role = "qa";
    }

    return {
      id: githubUser.id.toString(),
      name: githubUser.name || githubUser.login,
      email: githubUser.email || `${githubUser.login}@github.com`,
      avatar: githubUser.avatar_url,
      role,
      login: githubUser.login,
      bio: githubUser.bio,
      company: githubUser.company,
      location: githubUser.location,
      githubUrl: githubUser.html_url,
      contributions: contributions || 0,
    };
  }

  /**
   * Combina dados de diferentes fontes para obter uma lista completa de usuários
   */
  async getAllUsers(): Promise<User[]> {
    console.log("🚀 Buscando todos os usuários do GitHub...");

    try {
      // Buscar em paralelo
      const [contributors, recentCommitters] = await Promise.all([
        this.getRepositoryContributors(),
        this.getRecentCommitters(),
      ]);

      // Combinar e deduplificar usuários
      const allUsers = new Map<string, User>();

      // Adicionar colaboradores (prioridade maior)
      contributors.forEach((user) => {
        allUsers.set(user.id, user);
      });

      // Adicionar committers recentes
      recentCommitters.forEach((user) => {
        if (!allUsers.has(user.id)) {
          allUsers.set(user.id, user);
        }
      });

      const users = Array.from(allUsers.values());
      console.log(`✅ Total de ${users.length} usuários únicos encontrados`);

      return users;
    } catch (error) {
      console.error("Erro ao buscar todos os usuários:", error);
      return [];
    }
  }

  /**
   * Verifica rate limit da API
   */
  async checkRateLimit(): Promise<{
    remaining: number;
    limit: number;
    reset: Date;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rate_limit`, {
        headers: this.headers,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const core = data.rate;

      return {
        remaining: core.remaining,
        limit: core.limit,
        reset: new Date(core.reset * 1000),
      };
    } catch (error) {
      console.error("Erro ao verificar rate limit:", error);
      return null;
    }
  }
}

// Singleton instance
export const gitHubUsersService = new GitHubUsersService();
