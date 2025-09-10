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

  const githubService = new UnifiedGitHubService();

  useEffect(() => {
    loadPRs();
  }, []);

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

    try {
      const newPR = await githubService.createPR({
        title: newPRTitle,
        branch: newPRBranch,
      });

      onPRSelect(newPR);
      onCreatePR?.({ title: newPRTitle, branch: newPRBranch });
      setShowCreateForm(false);
      setNewPRTitle("");
      setNewPRBranch("");
      loadPRs();
    } catch (error) {
      console.error("Erro ao criar PR:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pull Request Vinculado
        </label>

        {selectedPR && (
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
        )}

        {!selectedPR && (
          <>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Buscar PRs por título, número ou branch..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                + Novo PR
              </button>
            </div>

            {showCreateForm && (
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
                  <input
                    type="text"
                    placeholder="Nome da branch (ex: feature/nova-funcionalidade)"
                    value={newPRBranch}
                    onChange={(e) => setNewPRBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePR}
                      disabled={!newPRTitle.trim() || !newPRBranch.trim()}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:bg-gray-400"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewPRTitle("");
                        setNewPRBranch("");
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-2">Carregando PRs...</p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {prs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {searchTerm
                      ? "Nenhum PR encontrado"
                      : "Nenhum PR disponível"}
                  </div>
                ) : (
                  prs.map((pr) => (
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
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
