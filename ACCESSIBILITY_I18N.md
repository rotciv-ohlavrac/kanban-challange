# 🌐 Internacionalização e ♿ Acessibilidade

Este projeto implementa recursos completos de **internacionalização (i18n)** e **acessibilidade (a11y)** seguindo as melhores práticas modernas.

## 🌐 **Internacionalização (i18n)**

### **Idiomas Suportados**

- 🇧🇷 **Português (pt)** - Idioma padrão
- 🇺🇸 **English (en)** - Inglês

### **Estrutura de Arquivos**

```
messages/
├── pt.json          # Traduções em português
├── en.json          # Traduções em inglês
├── [locale]/        # Páginas localizadas
└── i18n/
    ├── routing.ts   # Configuração de rotas
    └── request.ts   # Configuração de requisições
```

### **Como Usar**

#### **Em Componentes:**

```tsx
import { useTranslations } from "next-intl";

const MyComponent = () => {
  const t = useTranslations("kanban");

  return <h1>{t("title")}</h1>; // "Kanban Board" ou "Kanban Board"
};
```

#### **Navegação:**

```tsx
import { Link, useRouter } from "@/i18n/routing";

// Link automaticamente localizado
<Link href="/about">Sobre</Link>;

// Mudança de idioma programática
const router = useRouter();
router.push("/dashboard", { locale: "en" });
```

### **Adicionando Novos Idiomas**

1. **Criar arquivo de tradução:**

```bash
touch messages/es.json  # Espanhol
```

2. **Atualizar configuração:**

```tsx
// i18n/routing.ts
export const routing = defineRouting({
  locales: ["pt", "en", "es"], // Adicionar 'es'
  defaultLocale: "pt",
});
```

3. **Adicionar flag no seletor:**

```tsx
// components/LanguageSelector.tsx
const languages = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" }, // Novo
];
```

## ♿ **Acessibilidade (a11y)**

### **Recursos Implementados**

#### **🎹 Navegação por Teclado**

- **N** - Nova tarefa
- **/** - Focar na busca
- **Esc** - Fechar modal/busca
- **Enter** - Selecionar/Confirmar
- **↑↓←→** - Navegar entre elementos
- **Tab/Shift+Tab** - Navegação sequencial
- **Space** - Ativar/Selecionar

#### **🔊 Leitores de Tela**

- **ARIA labels** em todos os elementos interativos
- **ARIA roles** para definir propósito dos elementos
- **ARIA states** para indicar estados dinâmicos
- **Screen reader announcements** para mudanças de conteúdo
- **Semantic HTML** para estrutura clara

#### **👁️ Visual**

- **High contrast mode** support
- **Focus visible** indicators
- **Reduced motion** support
- **Screen reader only** content
- **Skip to content** link

### **Estrutura de Acessibilidade**

#### **ARIA Roles e Labels:**

```tsx
// Kanban Board
<div role="main" aria-label="Kanban Board">

  // Colunas
  <div role="region" aria-label="Coluna Backlog">

    // Cards de tarefa
    <div role="button" aria-label="Tarefa: Implementar drag & drop">

      // Drag handle
      <div aria-label="Alça para arrastar" tabIndex={0}>
```

#### **Navegação por Teclado:**

```tsx
// Hook personalizado
useKeyboardNavigation({
  onKeyN: () => openNewTaskModal(),
  onSlash: () => focusSearchInput(),
  onEscape: () => closeModal(),
  onArrowUp: () => navigateUp(),
  onArrowDown: () => navigateDown(),
});
```

#### **Gerenciamento de Foco:**

```tsx
// Focus trap em modais
const { containerRef, focusFirst, trapFocus } = useFocusManagement();

<div ref={containerRef} onKeyDown={trapFocus}>
  {/* Conteúdo do modal */}
</div>;
```

#### **Anúncios para Screen Reader:**

```tsx
const { announce } = useScreenReaderAnnouncements();

// Anunciar mudanças
announce("Nova tarefa criada", "polite");
announce("Erro crítico!", "assertive");
```

### **Classes CSS de Acessibilidade**

#### **Screen Reader Only:**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

#### **High Contrast:**

```css
@media (prefers-contrast: high) {
  .border {
    border-width: 2px;
  }

  .shadow-sm,
  .shadow-md,
  .shadow-lg {
    box-shadow: 0 0 0 2px currentColor;
  }
}
```

#### **Reduced Motion:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### **Componentes Acessíveis**

#### **1. SearchBar com Autocomplete**

```tsx
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-autocomplete="list"
  aria-controls="search-results"
  aria-activedescendant={`result-${selectedIndex}`}
/>

<ul id="search-results" role="listbox">
  <li role="option" aria-selected={isSelected}>
```

#### **2. Modal com Focus Trap**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onKeyDown={trapFocus}
>
  <h2 id="modal-title">Título do Modal</h2>
</div>
```

#### **3. Drag & Drop Acessível**

```tsx
<div
  draggable
  role="button"
  aria-label="Arrastar tarefa"
  tabIndex={0}
  onKeyDown={handleKeyboardDrag}
>
```

## 🧪 **Testando Acessibilidade**

### **Ferramentas Recomendadas**

#### **1. Screen Readers**

- **Windows:** NVDA (gratuito)
- **macOS:** VoiceOver (nativo)
- **Linux:** Orca

#### **2. Extensões do Browser**

- **axe DevTools** - Análise automática
- **WAVE** - Avaliação visual
- **Lighthouse** - Auditoria completa

#### **3. Testes Manuais**

```bash
# Navegação apenas por teclado
# Desconecte o mouse e navegue apenas com Tab, Enter, Esc, Setas

# High contrast mode
# Windows: Alt + Shift + PrtScr
# macOS: System Preferences > Accessibility > Display

# Screen reader
# Windows: Windows + Ctrl + Enter (Narrator)
# macOS: Cmd + F5 (VoiceOver)
```

### **Checklist de Acessibilidade**

#### **✅ Implementado:**

- [x] Navegação por teclado completa
- [x] ARIA labels e roles
- [x] Focus management
- [x] Screen reader support
- [x] High contrast mode
- [x] Reduced motion support
- [x] Skip to content link
- [x] Semantic HTML
- [x] Color contrast ratio > 4.5:1
- [x] Touch target size > 44px

#### **📋 Próximos Passos:**

- [ ] Testes com usuários reais
- [ ] Certificação WCAG 2.1 AA
- [ ] Suporte a mais screen readers
- [ ] Temas de alto contraste personalizados

## 🚀 **Performance**

### **Bundle Size**

- **next-intl:** ~15KB gzipped
- **Traduções:** ~2KB por idioma
- **Hooks de acessibilidade:** ~3KB gzipped

### **Otimizações**

- **Lazy loading** de traduções
- **Tree shaking** de traduções não utilizadas
- **Memoização** de componentes traduzidos
- **Code splitting** por idioma

## 📚 **Recursos Adicionais**

### **Documentação**

- [Next-intl Documentation](https://next-intl-docs.vercel.app/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### **Exemplos de Uso**

```tsx
// Pluralização
t("taskCount", { count: tasks.length });
// 0 tasks, 1 task, 2 tasks

// Interpolação
t("welcome", { name: "João" });
// "Bem-vindo, João!"

// Rich text
t.rich("terms", {
  link: (chunks) => <Link href="/terms">{chunks}</Link>,
});
```

---

🎯 **Objetivo:** Tornar o Kanban Board acessível para **todos os usuários**, independente de suas habilidades ou tecnologias assistivas utilizadas.

🌍 **Visão:** Um produto verdadeiramente **global** e **inclusivo**.
