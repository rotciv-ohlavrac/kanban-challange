"use client";

import React from "react";
import { UnifiedGitHubService } from "../services/unifiedGitHubService";

export const GitHubStatus: React.FC = () => {
  const githubService = new UnifiedGitHubService();
  const repoInfo = githubService.getRepositoryInfo();
  const isRealApi = githubService.isUsingRealApi();

  // Render functions for better performance
  const renderRepoInfo = () => {
    if (!isRealApi) return null;

    return (
      <span className="text-blue-600 ml-2">
        → {repoInfo.owner}/{repoInfo.repo}
      </span>
    );
  };

  const renderSimulatedMessage = () => {
    if (isRealApi) return null;

    return (
      <p className="text-xs text-blue-600 mt-1">
        💡 Para usar PRs reais, configure seu repositório em{" "}
        <code>config/github.ts</code>
      </p>
    );
  };

  const renderRealApiMessage = () => {
    if (!isRealApi) return null;

    return (
      <p className="text-xs text-blue-600 mt-1">
        ✅ Conectado ao repositório real. Os links dos PRs funcionarão
        corretamente.
      </p>
    );
  };

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">{isRealApi ? "🔗" : "🎭"}</span>
        <div className="text-sm">
          <span className="font-medium text-blue-800">
            {isRealApi ? "GitHub API Real" : "Dados Simulados"}
          </span>
          {renderRepoInfo()}
        </div>
      </div>

      {renderSimulatedMessage()}
      {renderRealApiMessage()}
    </div>
  );
};
