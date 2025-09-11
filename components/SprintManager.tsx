"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cva } from "class-variance-authority";
import { Sprint, Task } from "../types";
import { useKanban } from "../contexts/KanbanContext";
import { BurndownChart } from "./BurndownChart";
import {
  formatDate,
  addWorkingDays,
  getSprintProgress,
} from "../utils/dateUtils";

// Sprint Status Variants
const sprintStatusStyles = cva(
  ["px-2", "py-1", "rounded-full", "text-xs", "font-medium"],
  {
    variants: {
      status: {
        active: ["bg-green-100", "text-green-800"],
        completed: ["bg-blue-100", "text-blue-800"],
        planning: ["bg-gray-100", "text-gray-800"],
      },
    },
    defaultVariants: {
      status: "planning",
    },
  }
);

// Sprint Card Variants
const sprintCardStyles = cva(
  ["bg-white", "border", "rounded-lg", "p-4", "transition-all", "duration-200"],
  {
    variants: {
      isActive: {
        true: ["border-blue-400", "ring-2", "ring-blue-100"],
        false: ["border-gray-200", "hover:border-gray-300"],
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

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

  // Render functions for better performance
  const renderCurrentSprintInfo = () => {
    if (!currentSprint) return null;

    const stats = getSprintStats(currentSprint);

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {currentSprint.name}
            </h3>
            <p className="text-gray-600 mt-1">{currentSprint.description}</p>
          </div>
          <div className="text-right">
            <span
              className={sprintStatusStyles({ status: currentSprint.status })}
            >
              {t(currentSprint.status)}
            </span>
          </div>
        </div>

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
      </div>
    );
  };

  const renderBurndownChart = () => {
    if (!showBurndown || !currentSprint) return null;

    return <BurndownChart sprint={currentSprint} tasks={tasks} />;
  };

  const renderSprintsList = () => {
    return sprints.map((sprint) => {
      const stats = getSprintStats(sprint);
      const isActive = currentSprint?.id === sprint.id;

      return (
        <div key={sprint.id} className={sprintCardStyles({ isActive })}>
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-gray-900 line-clamp-1">
              {sprint.name}
            </h4>
            <span className={sprintStatusStyles({ status: sprint.status })}>
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
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isActive && (
              <button
                onClick={() => setShowBurndown(!showBurndown)}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
              >
                {showBurndown ? "Ocultar" : "Ver"} Burndown
              </button>
            )}
            <button
              onClick={() => handleActivateSprint(sprint.id)}
              disabled={isActive}
              className={`px-3 py-1 rounded-md transition-colors text-xs ${
                isActive
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isActive ? "Ativo" : "Ativar"}
            </button>
            <button
              onClick={() => handleCompleteSprint(sprint.id)}
              className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs"
            >
              Completar
            </button>
          </div>
        </div>
      );
    });
  };

  const renderCreateModal = () => {
    if (!isCreateModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {tCommon("createSprint")}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tCommon("name")}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tCommon("description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tCommon("startDate")}
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dias úteis
                </label>
                <select
                  value={formData.workingDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workingDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 dias</option>
                  <option value={10}>10 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={20}>20 dias</option>
                </select>
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
    );
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

      {renderCurrentSprintInfo()}
      {renderBurndownChart()}

      {/* Sprint List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderSprintsList()}
      </div>

      {renderCreateModal()}
    </div>
  );
};
