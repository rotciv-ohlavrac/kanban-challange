/**
 * Serviço de persistência usando IndexedDB
 * Gerencia o armazenamento local de tarefas, usuários e configurações
 */

import { Task, TaskStatus, User, Sprint } from "@/types";

interface DBSchema {
  tasks: Task;
  users: User;
  sprints: Sprint;
  settings: {
    id: string;
    value: any;
  };
}

class IndexedDBService {
  private dbName = "kanban-app";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("Erro ao abrir IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB inicializado com sucesso");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para tarefas
        if (!db.objectStoreNames.contains("tasks")) {
          const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
          taskStore.createIndex("status", "status", { unique: false });
          taskStore.createIndex("assignedTo", "assignedTo", { unique: false });
          taskStore.createIndex("sprintId", "sprintId", { unique: false });
          taskStore.createIndex("createdAt", "createdAt", { unique: false });
        }

        // Store para usuários
        if (!db.objectStoreNames.contains("users")) {
          const userStore = db.createObjectStore("users", { keyPath: "id" });
          userStore.createIndex("login", "login", { unique: true });
          userStore.createIndex("email", "email", { unique: false });
        }

        // Store para sprints
        if (!db.objectStoreNames.contains("sprints")) {
          const sprintStore = db.createObjectStore("sprints", {
            keyPath: "id",
          });
          sprintStore.createIndex("status", "status", { unique: false });
          sprintStore.createIndex("startDate", "startDate", { unique: false });
        }

        // Store para configurações
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }

        console.log("🔧 IndexedDB schema criado/atualizado");
      };
    });
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error("IndexedDB não foi inicializado. Chame init() primeiro.");
    }
    return this.db;
  }

  // ===== TAREFAS =====

  async saveTasks(tasks: Task[]): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");

    // Limpar todas as tarefas existentes
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Salvar todas as tarefas
    for (const task of tasks) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(task);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`💾 ${tasks.length} tarefas salvas no IndexedDB`);
  }

  async saveTask(task: Task): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");

    return new Promise((resolve, reject) => {
      const request = store.put(task);
      request.onsuccess = () => {
        console.log(`💾 Tarefa "${task.title}" salva no IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getTasks(): Promise<Task[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(["tasks"], "readonly");
    const store = transaction.objectStore("tasks");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const tasks = request.result || [];
        console.log(`📖 ${tasks.length} tarefas carregadas do IndexedDB`);
        resolve(tasks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["tasks"], "readwrite");
    const store = transaction.objectStore("tasks");

    return new Promise((resolve, reject) => {
      const request = store.delete(taskId);
      request.onsuccess = () => {
        console.log(`🗑️ Tarefa ${taskId} removida do IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== USUÁRIOS =====

  async saveUsers(users: User[]): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["users"], "readwrite");
    const store = transaction.objectStore("users");

    // Limpar usuários existentes
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Salvar novos usuários
    for (const user of users) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(user);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`👥 ${users.length} usuários salvos no IndexedDB`);
  }

  async saveUser(user: User): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["users"], "readwrite");
    const store = transaction.objectStore("users");

    return new Promise((resolve, reject) => {
      const request = store.put(user);
      request.onsuccess = () => {
        console.log(`👤 Usuário "${user.name}" salvo no IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUsers(): Promise<User[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(["users"], "readonly");
    const store = transaction.objectStore("users");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const users = request.result || [];
        console.log(`👥 ${users.length} usuários carregados do IndexedDB`);
        resolve(users);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== SPRINTS =====

  async saveSprints(sprints: Sprint[]): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["sprints"], "readwrite");
    const store = transaction.objectStore("sprints");

    // Limpar sprints existentes
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Salvar novos sprints
    for (const sprint of sprints) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(sprint);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`🏃 ${sprints.length} sprints salvos no IndexedDB`);
  }

  async saveSprint(sprint: Sprint): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["sprints"], "readwrite");
    const store = transaction.objectStore("sprints");

    return new Promise((resolve, reject) => {
      const request = store.put(sprint);
      request.onsuccess = () => {
        console.log(`🏃 Sprint "${sprint.name}" salvo no IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSprints(): Promise<Sprint[]> {
    const db = this.ensureDB();
    const transaction = db.transaction(["sprints"], "readonly");
    const store = transaction.objectStore("sprints");

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const sprints = request.result || [];
        console.log(`🏃 ${sprints.length} sprints carregados do IndexedDB`);
        resolve(sprints);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== CONFIGURAÇÕES =====

  async saveSetting(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    const transaction = db.transaction(["settings"], "readwrite");
    const store = transaction.objectStore("settings");

    return new Promise((resolve, reject) => {
      const request = store.put({ id: key, value });
      request.onsuccess = () => {
        console.log(`⚙️ Configuração "${key}" salva no IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    const db = this.ensureDB();
    const transaction = db.transaction(["settings"], "readonly");
    const store = transaction.objectStore("settings");

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== UTILITÁRIOS =====

  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const storeNames = ["tasks", "users", "sprints", "settings"];

    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log("🗑️ Todos os dados do IndexedDB foram limpos");
  }

  async getStorageUsage(): Promise<{ used: number; quota: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();
