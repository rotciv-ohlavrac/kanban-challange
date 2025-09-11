# Variants com Class Variance Authority

Este projeto utiliza `class-variance-authority` (CVA) para gerenciar variants de estilos diretamente nos componentes, seguindo o padrão de co-localização.

## Padrão Implementado

Cada componente que necessita de variants condicionais tem suas próprias definições de estilo usando CVA, mantendo tudo organizado no mesmo arquivo.

### Estrutura Padrão

```tsx
import { cva } from "class-variance-authority";

// Definição das variants no início do arquivo
const componentStyles = cva(
  ["classes-base-comuns"], // Classes base aplicadas sempre
  {
    variants: {
      variant: {
        primary: ["classes-para-primary"],
        secondary: ["classes-para-secondary"],
      },
      size: {
        sm: ["classes-pequeno"],
        lg: ["classes-grande"],
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
);

// Uso no componente
<div className={componentStyles({ variant: "primary", size: "lg" })}>
```

## Componentes Refatorados

### 1. TaskCard.tsx

**Variants implementadas:**

- `storyPointsStyles`: Para pontos de história
- `userRoleStyles`: Para roles de usuário

```tsx
// Story Points: zero, low, medium, high
const storyPointsStyles = cva([...], {
  variants: {
    points: {
      zero: ["bg-gray-100", "text-gray-700"],
      low: ["bg-green-100", "text-green-700"],
      medium: ["bg-yellow-100", "text-yellow-700"],
      high: ["bg-red-100", "text-red-700"],
    },
  },
});

// User Roles: developer, designer, pm, qa, default
const userRoleStyles = cva([...], {
  variants: {
    role: {
      developer: ["bg-blue-100", "text-blue-700"],
      designer: ["bg-purple-100", "text-purple-700"],
      // ...
    },
  },
});
```

### 2. SearchBar.tsx

**Variants implementadas:**

- `taskStatusStyles`: Para status de tarefas

```tsx
// Task Status: backlog, in-progress, completed
const taskStatusStyles = cva([...], {
  variants: {
    status: {
      backlog: ["bg-slate-100", "text-slate-800"],
      "in-progress": ["bg-blue-100", "text-blue-800"],
      completed: ["bg-emerald-100", "text-emerald-800"],
    },
  },
});
```

### 3. Column.tsx

**Variants implementadas:**

- `columnHeaderStyles`: Para cabeçalhos das colunas
- `columnTitleStyles`: Para títulos das colunas

```tsx
// Column Headers
const columnHeaderStyles = cva([...], {
  variants: {
    status: {
      backlog: ["bg-slate-50", "border-slate-200"],
      "in-progress": ["bg-blue-50", "border-blue-200"],
      completed: ["bg-emerald-50", "border-emerald-200"],
    },
  },
});
```

### 4. ConfirmationModal.tsx

**Variants implementadas:**

- `confirmationButtonStyles`: Para botões de confirmação
- `modalIconBackgroundStyles`: Para background dos ícones
- `modalIconTextStyles`: Para cores dos ícones

```tsx
// Confirmation Buttons: danger, warning, info
const confirmationButtonStyles = cva([...], {
  variants: {
    type: {
      danger: ["bg-red-600", "hover:bg-red-700"],
      warning: ["bg-yellow-600", "hover:bg-yellow-700"],
      info: ["bg-blue-600", "hover:bg-blue-700"],
    },
  },
});
```

## Vantagens desta Abordagem

### ✅ **Co-localização**

- Variants ficam próximas ao código que as usa
- Fácil de encontrar e modificar
- Menos imports entre arquivos

### ✅ **Type Safety**

- TypeScript verifica automaticamente as variants
- Autocompletar funciona perfeitamente
- Erros detectados em tempo de compilação

### ✅ **Manutenibilidade**

- Cada componente é independente
- Mudanças não afetam outros componentes
- Fácil de refatorar individualmente

### ✅ **Performance**

- Apenas as classes necessárias são incluídas
- Tree-shaking funciona automaticamente
- Bundle menor e mais otimizado

## Comparação: Antes vs Depois

### ❌ **Antes (Switch Cases)**

```tsx
const getRoleColor = (role: string) => {
  switch (role) {
    case "developer": return "bg-blue-100 text-blue-700";
    case "designer": return "bg-purple-100 text-purple-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

<span className={`px-2 py-1 ${getRoleColor(role)}`}>
```

### ✅ **Depois (CVA)**

```tsx
const userRoleStyles = cva(["px-2", "py-1"], {
  variants: {
    role: {
      developer: ["bg-blue-100", "text-blue-700"],
      designer: ["bg-purple-100", "text-purple-700"],
      default: ["bg-gray-100", "text-gray-700"],
    },
  },
});

<span className={userRoleStyles({ role: "developer" })}>
```

## Como Adicionar Novas Variants

1. **Defina a variant no componente:**

```tsx
const newStyles = cva(["base-classes"], {
  variants: {
    size: {
      sm: ["h-8"],
      md: ["h-10"],
      lg: ["h-12"],
    },
  },
  defaultVariants: {
    size: "md",
  },
});
```

2. **Use no JSX:**

```tsx
<div className={newStyles({ size: "lg" })}>
```

3. **Com compound variants (opcional):**

```tsx
const buttonStyles = cva([], {
  variants: {
    variant: { primary: [], secondary: [] },
    size: { sm: [], lg: [] },
  },
  compoundVariants: [
    {
      variant: "primary",
      size: "lg",
      class: ["text-xl", "font-bold"],
    },
  ],
});
```

## Status Atual

✅ **Concluído:**

- TaskCard: Story points e user roles
- SearchBar: Task status
- Column: Header e title variants
- ConfirmationModal: Button, icon background e icon text variants
- Limpeza de arquivos desnecessários
- Build funcionando corretamente

🎯 **Resultado:**

- Zero switch cases para estilos
- 100% type-safe
- Co-localização completa
- Performance otimizada
