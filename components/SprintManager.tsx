"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Sprint, Task } from "../types";
import { useKanban } from "../contexts/KanbanContext";
import { BurndownChart } from "./BurndownChart";
import {
  formatDate,
  addWorkingDays,
  getSprintProgress,
} from "../utils/dateUtils";

export const SprintManager: React.FC = () => {
  const t = useTranslations("sprint");
  const tCommon = useTranslations("common");
  const {
    sprints,
    currentSprint,
    setCurrentSprint,
    tasks,
    addSprint,
    updateSprint,
  } = useKanban();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showBurndown, setShowBurndown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    workingDays: 5,
  });

  const handleCreateSprint = useCallback(() => {
    if (!formData.name.trim()) return;

    const startDate = new Date(formData.startDate);
    const endDate = addWorkingDays(startDate, formData.workingDays);

    addSprint({
      name: formData.name,
      description: formData.description,
      startDate,
      endDate,
      workingDays: formData.workingDays,
      status: "planning",
    });

    setFormData({
      name: "",
      description: "",
      startDate: "",
      workingDays: 5,
    });
    setIsCreateModalOpen(false);
  }, [formData, addSprint]);

  const handleActivateSprint = useCallback(
    (sprintId: string) => {
      updateSprint(sprintId, { status: "active" });
    },
    [updateSprint]
  );

  const handleCompleteSprint = useCallback(
    (sprintId: string) => {
      updateSprint(sprintId, { status: "completed" });
    },
    [updateSprint]
  );

  const getSprintTasks = useCallback(
    (sprintId: string): Task[] => {
      return tasks.filter((task) => task.sprintId === sprintId);
    },
    [tasks]
  );

  const getSprintStats = (sprint: Sprint) => {
    const sprintTasks = getSprintTasks(sprint.id);
    const totalPoints = sprintTasks.reduce(
      (sum, task) => sum + task.storyPoints,
      0
    );
    const completedPoints = sprintTasks
      .filter((task) => task.status === "completed")
      .reduce((sum, task) => sum + task.storyPoints, 0);

    const progress = getSprintProgress(sprint);

    return {
      totalTasks: sprintTasks.length,
      totalPoints,
      completedPoints,
      completedTasks: sprintTasks.filter((task) => task.status === "completed")
        .length,
      ...progress,
    };
  };

  const getStatusColor = (status: Sprint["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
          {currentSprint && (
            <p className="text-sm text-gray-600 mt-1">
              {t("current")}: {currentSprint.name}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {currentSprint && (
            <button
              onClick={() => setShowBurndown(!showBurndown)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              📊 {t("burndown")}
            </button>
          )}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + {t("new")}
          </button>
        </div>
      </div>

      {/* Current Sprint Info */}
      {currentSprint && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {currentSprint.name}
              </h3>
              <p className="text-gray-600 mt-1">{currentSprint.description}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                currentSprint.status
              )}`}
            >
              {t(currentSprint.status)}
            </span>
          </div>

          {(() => {
            const stats = getSprintStats(currentSprint);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Período:</span>
                  <div className="font-medium">
                    {formatDate(currentSprint.startDate)} -{" "}
                    {formatDate(currentSprint.endDate)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Progresso:</span>
                  <div className="font-medium">
                    {stats.completedTasks}/{stats.totalTasks} tarefas
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Story Points:</span>
                  <div className="font-medium">
                    {stats.completedPoints}/{stats.totalPoints} pontos
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Dias:</span>
                  <div className="font-medium">
                    {stats.elapsedDays}/{stats.totalDays} dias úteis
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Burndown Chart */}
      {showBurndown && currentSprint && (
        <BurndownChart sprint={currentSprint} tasks={tasks} />
      )}

      {/* Sprint List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sprints.map((sprint) => {
          const stats = getSprintStats(sprint);
          const isActive = currentSprint?.id === sprint.id;

          return (
            <div
              key={sprint.id}
              className={`
                bg-white border rounded-lg p-4 transition-all duration-200
                ${
                  isActive
                    ? "border-blue-400 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900 line-clamp-1">
                  {sprint.name}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    sprint.status
                  )}`}
                >
                  {t(sprint.status)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {sprint.description}
              </p>

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div>
                  {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                </div>
                <div>
                  {stats.completedTasks}/{stats.totalTasks} tarefas •{" "}
                  {stats.completedPoints}/{stats.totalPoints} pontos
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        stats.totalPoints > 0
                          ? (stats.completedPoints / stats.totalPoints) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                {!isActive && (
                  <button
                    onClick={() => setCurrentSprint(sprint.id)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    {t("selectSprint")}
                  </button>
                )}
                {sprint.status === "planning" && (
                  <button
                    onClick={() => handleActivateSprint(sprint.id)}
                    className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Ativar
                  </button>
                )}
                {sprint.status === "active" && (
                  <button
                    onClick={() => handleCompleteSprint(sprint.id)}
                    className="flex-1 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sprints.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
          <p className="text-lg font-medium mb-2">{t("noSprints")}</p>
          <p className="text-sm">{t("defaultDuration")}</p>
        </div>
      )}

      {/* Create Sprint Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("create")}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("name")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  placeholder="Sprint 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  placeholder="Descrição do sprint..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("startDate")}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("workingDays")}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.workingDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workingDays: parseInt(e.target.value) || 5,
                      }))
                    }
                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleCreateSprint}
                disabled={!formData.name.trim() || !formData.startDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tCommon("create")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
