# 🔗 Integração com GitHub - Guia Completo

Este projeto suporta tanto **dados simulados** quanto **integração real** com a API do GitHub.

## 🎭 **Modo Atual: Simulação**

Por padrão, o projeto usa dados simulados para demonstração. Os links dos PRs apontam para URLs fictícias.

## 🔧 **Como Configurar API Real do GitHub**

### 1. **Editar Configuração**

Abra o arquivo `config/github.ts` e altere:

```typescript
export const GITHUB_CONFIG = {
  mode: "api" as "mock" | "api", // Mude para 'api'
  api: {
    owner: "seu-usuario", // Seu nome de usuário GitHub
    repo: "seu-repositorio", // Nome do seu repositório
    token: process.env.GITHUB_TOKEN, // Token opcional
  },
};
```

### 2. **Criar Token de Acesso (Opcional mas Recomendado)**

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione as permissões:
   - `repo` (para acessar repositórios privados)
   - `public_repo` (para repositórios públicos)
4. Copie o token gerado

### 3. **Configurar Variável de Ambiente**

Crie um arquivo `.env.local`:

```bash
GITHUB_TOKEN=seu_token_aqui
```

### 4. **Exemplos de Configuração**

#### Para repositório público:

```typescript
export const GITHUB_CONFIG = {
  mode: "api",
  api: {
    owner: "facebook",
    repo: "react",
    // token não é necessário para repos públicos
  },
};
```

#### Para seu próprio repositório:

```typescript
export const GITHUB_CONFIG = {
  mode: "api",
  api: {
    owner: "seu-usuario",
    repo: "meu-projeto",
    token: process.env.GITHUB_TOKEN,
  },
};
```

## 📊 **Rate Limits**

### Sem Token:

- 60 requests por hora por IP

### Com Token:

- 5.000 requests por hora

## ✨ **Funcionalidades com API Real**

### ✅ **O que funciona:**

- ✅ Buscar PRs reais do repositório
- ✅ Links funcionais para PRs no GitHub
- ✅ Status real dos PRs (open, merged, closed)
- ✅ Informações reais (autor, branch, datas)
- ✅ Sincronização de status

### 🚧 **Limitações:**

- ❌ Criar PRs requer token com permissões
- ❌ Modificar PRs requer permissões especiais
- ⚠️ Rate limits podem limitar uso intensivo

## 🔍 **Testando a Integração**

1. Configure um repositório público (ex: `facebook/react`)
2. Mude o modo para `'api'`
3. Reinicie o servidor: `pnpm dev`
4. Observe o status no topo da página
5. Teste buscar PRs reais
6. Clique nos links dos PRs

## 🛠️ **Resolução de Problemas**

### Erro 403 - Rate limit exceeded:

- Configure um token de acesso
- Reduza a frequência de requests

### Erro 404 - Not found:

- Verifique se o repositório existe
- Confirme owner/repo corretos
- Para repos privados, use token

### Links não funcionam:

- Verifique se está no modo 'api'
- Confirme que os PRs existem no repositório

## 🔄 **Voltando para Simulação**

Para voltar aos dados simulados:

```typescript
export const GITHUB_CONFIG = {
  mode: "mock", // Voltar para simulação
  // ...
};
```

## 📝 **Estrutura dos Dados**

Ambos os modos retornam a mesma estrutura:

```typescript
interface GitHubPR {
  number: number; // Número do PR
  title: string; // Título
  url: string; // URL real do GitHub
  status: "open" | "closed" | "merged";
  author: string; // Nome do autor
  createdAt: string; // Data de criação
  updatedAt: string; // Última atualização
  branch: string; // Branch do PR
  repository: string; // owner/repo
}
```

---

💡 **Dica:** Comece com um repositório público conhecido (como `facebook/react`) para testar a integração antes de usar seu próprio repositório.
