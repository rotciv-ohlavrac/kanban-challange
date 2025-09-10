# Kanban Board - AnaHealth Challenge

Um Kanban board moderno e responsivo construído com React.js, Next.js e TypeScript, inspirado no design do Twilio Paste.

## 🚀 Funcionalidades

- ✅ **Drag & Drop**: Arraste tarefas entre as colunas (Backlog, Em andamento, Concluída)
- 🔍 **Busca**: Busque tarefas por título em tempo real
- ✏️ **Edição**: Edite título, descrição e status das tarefas
- ➕ **Criação**: Adicione novas tarefas facilmente
- 🗑️ **Exclusão**: Remova tarefas com confirmação
- 📱 **Responsivo**: Interface adaptável para diferentes tamanhos de tela
- 🎨 **Design Moderno**: Interface limpa inspirada no Twilio Paste

## 🛠️ Tecnologias Utilizadas

- **React.js 19.1.0** - Framework principal
- **Next.js 15.5.2** - Framework React com SSR
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **@dnd-kit** - Biblioteca de drag & drop
- **UUID** - Geração de IDs únicos

## 📦 Instalação

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd anahealth-challange
```

2. Instale as dependências:

```bash
pnpm install
```

3. Execute o projeto em modo de desenvolvimento:

```bash
pnpm dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎯 Como Usar

### Criando uma Nova Tarefa

1. Clique no botão "Nova Tarefa" no canto superior direito
2. Preencha o título e descrição
3. Selecione o status inicial
4. Clique em "Salvar"

### Editando uma Tarefa

1. Clique em qualquer tarefa para abrir o modal de edição
2. Modifique o título, descrição ou status
3. Clique em "Salvar" para aplicar as mudanças

### Movendo Tarefas

1. Arraste qualquer tarefa para uma nova coluna
2. A tarefa será automaticamente movida e o status atualizado

### Buscando Tarefas

1. Use a barra de busca no topo da página
2. Digite parte do título da tarefa
3. Os resultados são filtrados em tempo real

## 🏗️ Estrutura do Projeto

```
anahealth-challange/
├── app/
│   └── page.tsx              # Página principal
├── components/
│   ├── KanbanBoard.tsx       # Componente principal do Kanban
│   ├── Column.tsx            # Componente de coluna
│   ├── TaskCard.tsx          # Componente de card de tarefa
│   ├── TaskModal.tsx         # Modal de edição/criação
│   └── SearchBar.tsx         # Barra de busca
├── contexts/
│   └── KanbanContext.tsx     # Contexto para gerenciamento de estado
├── types/
│   └── index.ts              # Definições de tipos TypeScript
└── README.md
```

## 🎨 Design System

O projeto utiliza uma paleta de cores inspirada no Twilio Paste:

- **Backlog**: Tons de cinza/slate
- **Em andamento**: Tons de azul
- **Concluída**: Tons de verde/emerald

## 📱 Responsividade

O Kanban é totalmente responsivo e funciona bem em:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🚀 Scripts Disponíveis

- `pnpm dev` - Executa o projeto em modo de desenvolvimento
- `pnpm build` - Gera build de produção
- `pnpm start` - Executa o build de produção
- `pnpm lint` - Executa o linter
- `pnpm format` - Formata o código

## 📝 Notas de Desenvolvimento

- O projeto utiliza Context API para gerenciamento de estado
- Drag & drop implementado com @dnd-kit para melhor performance
- Todas as operações são otimizadas com useCallback
- Interface totalmente acessível com ARIA labels
- Código totalmente tipado com TypeScript

## 🎯 Requisitos Atendidos

✅ Feito em React.js  
✅ Drag & drop de tarefas entre as colunas  
✅ Busca por título  
✅ Descrição em cada card  
✅ Editar título, descrição e status  
✅ Mudança de status move o card automaticamente  
✅ Layout inspirado no Trello  
✅ Tema Twilio Paste aplicado

---

Desenvolvido para o desafio de programação da AnaHealth 🏥
