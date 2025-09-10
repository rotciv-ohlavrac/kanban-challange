"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "../types";
import { UnifiedGitHubService } from "../services/unifiedGitHubService";
import { useTranslations } from "next-intl";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const tPoints = useTranslations("storyPoints");
  const tUser = useTranslations("user");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const githubService = new UnifiedGitHubService();

  const getPointsColor = (points: number) => {
    if (points === 0) return "bg-gray-100 text-gray-700";
    if (points <= 3) return "bg-green-100 text-green-700";
    if (points <= 8) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "developer":
        return "bg-blue-100 text-blue-700";
      case "designer":
        return "bg-purple-100 text-purple-700";
      case "pm":
        return "bg-green-100 text-green-700";
      case "qa":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-400 hover:scale-[1.02]"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h3>
        {/* Story Points */}
        {task.storyPoints > 0 && (
          <div
            className={`
            ml-2 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
            ${getPointsColor(task.storyPoints)}
          `}
          >
            {task.storyPoints}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
        {task.description}
      </p>

      {/* Usuário Atribuído */}
      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          {task.assignedTo.avatar && (
            <img
              src={task.assignedTo.avatar}
              alt={task.assignedTo.name}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-xs font-medium text-gray-700 flex-1 truncate">
            {task.assignedTo.name}
          </span>
          <span
            className={`px-2 py-1 text-xs rounded-full ${getRoleColor(
              task.assignedTo.role
            )}`}
          >
            {tUser(`roles.${task.assignedTo.role}`)}
          </span>
        </div>
      )}

      {/* Informações do PR */}
      {task.githubPR && (
        <div className="mt-3 p-2 bg-gray-50 rounded-md border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {githubService.getStatusIcon(task.githubPR.status)}
              </span>
              <span className="text-xs font-medium text-gray-700">
                #{task.githubPR.number}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${githubService.getStatusColor(
                  task.githubPR.status
                )}`}
              >
                {task.githubPR.status}
              </span>
            </div>
            <a
              href={task.githubPR.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:text-blue-800 text-xs"
              title="Ver PR no GitHub"
            >
              GitHub
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {task.githubPR.branch}
          </p>
        </div>
      )}

      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <span>Criado em {task.createdAt.toLocaleDateString("pt-BR")}</span>
        {task.updatedAt.getTime() !== task.createdAt.getTime() && (
          <span>
            Atualizado em {task.updatedAt.toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
};
