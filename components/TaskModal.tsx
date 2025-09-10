"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Task, GitHubPR, TaskStatus, TASK_STATUS_CONFIG, User } from "../types";
import { PRSelector } from "./PRSelector";
import { UserSelector } from "./UserSelector";
import { StoryPointsSelector } from "./StoryPointsSelector";
import { UnifiedGitHubService } from "../services/unifiedGitHubService";
import { ConfirmationModal } from "./ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";
import { useKanban } from "../contexts/KanbanContext";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const tUser = useTranslations("user");
  const tPoints = useTranslations("storyPoints");
  const { currentSprint } = useKanban();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);
  const [storyPoints, setStoryPoints] = useState(0);
  const [assignedUser, setAssignedUser] = useState<User | undefined>();
  const [selectedPR, setSelectedPR] = useState<GitHubPR | undefined>();

  const githubService = new UnifiedGitHubService();
  const { confirmationState, showConfirmation } = useConfirmation();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setStoryPoints(task.storyPoints || 0);
      setAssignedUser(task.assignedTo);
      setSelectedPR(task.githubPR);
    } else {
      setTitle("");
      setDescription("");
      setStatus(TaskStatus.BACKLOG);
      setStoryPoints(0);
      setAssignedUser(undefined);
      setSelectedPR(undefined);
    }
  }, [task]);

  const handleSave = async () => {
    // Se há PR vinculado, sugerir status baseado no PR
    let finalStatus = status;
    if (selectedPR) {
      const suggestedStatus = githubService.suggestTaskStatus(
        selectedPR.status
      );
      if (suggestedStatus !== status) {
        const confirmed = await showConfirmation({
          title: t("statusSuggestion"),
          message: t("statusSuggestion", {
            status: TASK_STATUS_CONFIG[suggestedStatus].label,
          }),
          type: "info",
          confirmText: tCommon("confirm"),
          cancelText: tCommon("cancel"),
        });

        if (confirmed) {
          finalStatus = suggestedStatus;
        }
      }
    }

    const taskData: Partial<Task> = {
      title,
      description,
      status: finalStatus,
      storyPoints,
      assignedTo: assignedUser,
      githubPR: selectedPR,
      sprintId: currentSprint?.id,
    };

    // Set completedAt when task is marked as completed
    if (
      finalStatus === TaskStatus.COMPLETED &&
      task?.status !== TaskStatus.COMPLETED
    ) {
      taskData.completedAt = new Date();
    } else if (finalStatus !== TaskStatus.COMPLETED) {
      taskData.completedAt = undefined;
    }

    onSave(taskData);
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;

    const confirmed = await showConfirmation({
      title: t("deleteConfirm"),
      message: `${t("deleteConfirm")}\n\n"${task.title}"`,
      type: "danger",
      confirmText: tCommon("delete"),
      cancelText: tCommon("cancel"),
    });

    if (confirmed) {
      onDelete(task.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {task ? "Editar Tarefa" : "Nova Tarefa"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder-gray-600"
              placeholder="Digite o título da tarefa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder-gray-600"
              placeholder="Digite a descrição da tarefa"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("status")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 placeholder-gray-600"
              >
                <option value={TaskStatus.BACKLOG}>
                  {TASK_STATUS_CONFIG[TaskStatus.BACKLOG].label}
                </option>
                <option value={TaskStatus.IN_PROGRESS}>
                  {TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].label}
                </option>
                <option value={TaskStatus.COMPLETED}>
                  {TASK_STATUS_CONFIG[TaskStatus.COMPLETED].label}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tPoints("estimate")}
              </label>
              <div className="flex items-center">
                <StoryPointsSelector
                  value={storyPoints}
                  onChange={setStoryPoints}
                />
                <span className="ml-3 text-sm text-gray-600">
                  {storyPoints} {tPoints("points")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tUser("assignedTo")}
            </label>
            <UserSelector
              selectedUser={assignedUser}
              onUserSelect={setAssignedUser}
              placeholder={tUser("selectUser")}
            />
          </div>

          <PRSelector
            selectedPR={selectedPR}
            onPRSelect={setSelectedPR}
            onCreatePR={(data) => {
              // Atualizar título da tarefa se ainda estiver vazio
              if (!title.trim()) {
                setTitle(data.title);
              }
            }}
          />
        </div>

        <div className="flex justify-between mt-6">
          <div>
            {task && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            )}
          </div>

          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
      />
    </div>
  );
};
