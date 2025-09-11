"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { User } from "../types";
import { indexedDBService } from "../services/indexedDbService";
import { gitHubUsersService } from "../services/githubUsersService";

interface UsersContextType {
  // State
  users: User[];
  isLoading: boolean;

  // Actions
  addUser: (userData: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  refreshUsersFromGitHub: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users from IndexedDB or GitHub
  useEffect(() => {
    const initializeUsers = async () => {
      try {
        setIsLoading(true);
        await indexedDBService.init();
        const savedUsers = await indexedDBService.getUsers();

        if (savedUsers.length === 0) {
          console.log("👥 Nenhum usuário encontrado, buscando do GitHub...");
          try {
            const githubUsers = await gitHubUsersService.getAllUsers();
            if (githubUsers.length > 0) {
              await indexedDBService.saveUsers(githubUsers);
              setUsers(githubUsers);
            } else {
              console.log("⚠️ Nenhum usuário encontrado no GitHub");
            }
          } catch (error) {
            console.error("❌ Erro ao buscar usuários do GitHub:", error);
          }
        } else {
          setUsers(savedUsers);
        }
      } catch (error) {
        console.error("❌ Erro ao carregar usuários:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUsers();
  }, []);

  // Save users to IndexedDB whenever they change
  useEffect(() => {
    if (!isLoading && users.length >= 0) {
      indexedDBService.saveUsers(users).catch(console.error);
    }
  }, [users, isLoading]);

  // User management functions
  const addUser = useCallback((userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
    };

    setUsers((prev) => [...prev, newUser]);
    console.log(`👤 Usuário "${newUser.name}" adicionado`);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
    console.log(`📝 Usuário ${id} atualizado`);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
    console.log(`🗑️ Usuário ${id} removido`);
  }, []);

  const refreshUsersFromGitHub = useCallback(async () => {
    try {
      setIsLoading(true);
      const githubUsers = await gitHubUsersService.getAllUsers();
      if (githubUsers.length > 0) {
        await indexedDBService.saveUsers(githubUsers);
        setUsers(githubUsers);
        console.log(`🔄 ${githubUsers.length} usuários atualizados do GitHub`);
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar usuários do GitHub:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue: UsersContextType = {
    // State
    users,
    isLoading,

    // Actions
    addUser,
    updateUser,
    deleteUser,
    refreshUsersFromGitHub,
  };

  return (
    <UsersContext.Provider value={contextValue}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
};

export default UsersProvider;
