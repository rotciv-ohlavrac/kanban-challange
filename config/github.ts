export const GITHUB_CONFIG = {
  mode: "api" as "mock" | "api", // ✅ MUDANÇA: Voltando para mock para evitar rate limiting
  api: {
    owner: "rotciv-ohlavrac", // Substitua pelo seu usuário/organização
    repo: "kanban-challange", // Substitua pelo seu repositório
    token: process.env.GITHUB_TOKEN, // Token de acesso pessoal (opcional)
  },
  urls: {
    api: "https://api.github.com",
    web: "https://github.com",
  },
};
