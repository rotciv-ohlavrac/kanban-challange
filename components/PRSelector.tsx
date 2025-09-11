"use client";

import React, { useState, useEffect } from "react";
import { GitHubPR } from "../types";
import { UnifiedGitHubService } from "../services/unifiedGitHubService";

interface PRSelectorProps {
  selectedPR?: GitHubPR;
  onPRSelect: (pr: GitHubPR | undefined) => void;
  onCreatePR?: (data: { title: string; branch: string }) => void;
}

export const PRSelector: React.FC<PRSelectorProps> = ({
  selectedPR,
  onPRSelect,
  onCreatePR,
}) => {
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPRTitle, setNewPRTitle] = useState("");
  const [newPRBranch, setNewPRBranch] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const githubService = UnifiedGitHubService.getInstance();

  useEffect(() => {
    loadPRs();
  }, []);

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      console.log("🌿 Carregando branches do repositório...");
      const branchList = await githubService.getBranches();
      console.log("✅ Branches carregadas:", branchList);
      setBranches(branchList);
    } catch (error) {
      console.error("❌ Erro ao carregar branches:", error);
      // Fallback para branches padrão
      setBranches(["main", "develop", "feature/nova-funcionalidade"]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const loadPRs = async () => {
    setLoading(true);
    try {
      const allPRs = await githubService.searchPRs();
      setPRs(allPRs);
    } catch (error) {
      console.error("Erro ao carregar PRs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      loadPRs();
      return;
    }

    setLoading(true);
    try {
      const filteredPRs = await githubService.searchPRs(term);
      setPRs(filteredPRs);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePR = async () => {
    if (!newPRTitle.trim() || !newPRBranch.trim()) return;

    setCreatingPR(true);
    setCreateError(null);

    try {
      console.log("🚀 Criando PR:", { title: newPRTitle, branch: newPRBranch });

      const newPR = await githubService.createPR({
        title: newPRTitle,
        branch: newPRBranch,
      });

      console.log("✅ PR criado com sucesso:", newPR);

      onPRSelect(newPR);
      onCreatePR?.({ title: newPRTitle, branch: newPRBranch });
      setShowCreateForm(false);
      setNewPRTitle("");
      setNewPRBranch("");
      setShowBranchDropdown(false);
      loadPRs();
    } catch (error) {
      console.error("❌ Erro ao criar PR:", error);
      setCreateError(
        error instanceof Error ? error.message : "Erro desconhecido ao criar PR"
      );
    } finally {
      setCreatingPR(false);
    }
  };

  // Render functions for better performance
  const renderBranchOptions = () => {
    return branches
      .filter((branch) =>
        branch.toLowerCase().includes(newPRBranch.toLowerCase())
      )
      .map((branch) => (
        <div
          key={branch}
          onClick={() => {
            setNewPRBranch(branch);
            setShowBranchDropdown(false);
          }}
          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
        >
          {branch}
        </div>
      ));
  };

  const renderBranchDropdown = () => {
    if (!showBranchDropdown) return null;

    return (
      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
        {loadingBranches ? (
          <div className="p-2 text-center text-gray-500 text-sm">
            Carregando branches...
          </div>
        ) : branches.length > 0 ? (
          <>
            <div className="p-2 text-xs text-gray-500 border-b">
              Selecione uma branch:
            </div>
            {renderBranchOptions()}
          </>
        ) : (
          <div className="p-2 text-center text-gray-500 text-sm">
            Nenhuma branch encontrada
          </div>
        )}
      </div>
    );
  };

  const renderPRsList = () => {
    return prs.map((pr) => (
      <div
        key={pr.number}
        onClick={() => onPRSelect(pr)}
        className="p-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {githubService.getStatusIcon(pr.status)}
              </span>
              <span className="font-medium text-gray-900 text-sm">
                #{pr.number}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${githubService.getStatusColor(
                  pr.status
                )}`}
              >
                {pr.status}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mt-1">
              {pr.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {pr.branch} • {pr.author}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  const renderPRsContent = () => {
    if (loading) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          Carregando PRs...
        </div>
      );
    }

    if (prs.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          {searchTerm ? "Nenhum PR encontrado" : "Nenhum PR disponível"}
        </div>
      );
    }

    return renderPRsList();
  };

  const renderSelectedPR = () => {
    if (!selectedPR) return null;

    return (
      <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {githubService.getStatusIcon(selectedPR.status)}
              </span>
              <span className="font-medium text-gray-900">
                #{selectedPR.number}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${githubService.getStatusColor(
                  selectedPR.status
                )}`}
              >
                {selectedPR.status}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mt-1">
              {selectedPR.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {selectedPR.branch} • {selectedPR.author}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={selectedPR.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ver no GitHub
            </a>
            <button
              onClick={() => onPRSelect(undefined)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSearchAndActions = () => {
    if (selectedPR) return null;

    return (
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Buscar PRs por título, número ou branch..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) {
              loadBranches();
            }
          }}
          className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
        >
          + Novo PR
        </button>
      </div>
    );
  };

  const renderCreateForm = () => {
    if (!showCreateForm || selectedPR) return null;

    return (
      <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Criar Novo PR
        </h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Título do PR"
            value={newPRTitle}
            onChange={(e) => setNewPRTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <div className="relative">
            <input
              type="text"
              placeholder="Nome da branch (ex: feature/nova-funcionalidade)"
              value={newPRBranch}
              onChange={(e) => setNewPRBranch(e.target.value)}
              onFocus={() => setShowBranchDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            {renderBranchDropdown()}
          </div>

          {createError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">❌ {createError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreatePR}
              disabled={creatingPR || !newPRTitle.trim() || !newPRBranch.trim()}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {creatingPR ? "Criando..." : "Criar PR"}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewPRTitle("");
                setNewPRBranch("");
                setCreateError(null);
                setShowBranchDropdown(false);
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pull Request Vinculado
        </label>
        {renderSelectedPR()}
        {renderSearchAndActions()}
        {renderCreateForm()}
        {!selectedPR && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {renderPRsContent()}
          </div>
        )}
      </div>
    </div>
  );
};
