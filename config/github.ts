// Configuração para integração com GitHub

export const GITHUB_CONFIG = {
  // Modo: 'mock' para simulação, 'api' para API real
  mode: "mock" as "mock" | "api", // ✅ MUDANÇA: Voltando para mock para evitar rate limiting

  // Configurações para API real do GitHub
  api: {
    owner: "facebook", // Substitua pelo seu usuário/organização
    repo: "react", // Substitua pelo seu repositório
    token: process.env.GITHUB_TOKEN, // Token de acesso pessoal (opcional)
  },

  // URLs base para diferentes ambientes
  urls: {
    api: "https://api.github.com",
    web: "https://github.com",
  },
};

// Exemplo de como configurar para seu projeto real:
/*
export const GITHUB_CONFIG = {
  mode: 'api' as 'mock' | 'api',
  api: {
    owner: 'seu-usuario',      // Seu nome de usuário no GitHub
    repo: 'seu-repositorio',   // Nome do seu repositório
    token: process.env.GITHUB_TOKEN, // Token opcional para mais requests
  },
};
*/
