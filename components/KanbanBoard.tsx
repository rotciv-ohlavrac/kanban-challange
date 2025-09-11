"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { Task, TaskStatus } from "../types";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./TaskModal";
import { SearchBar } from "./SearchBar";
import { GitHubStatus } from "./GitHubStatus";
import { LanguageSelector } from "./LanguageSelector";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { ConfirmationModal } from "./ConfirmationModal";
import { SprintManager } from "./SprintManager";
import { useKanban } from "../contexts/KanbanContext";
import { usePRAutomation } from "../hooks/usePRAutomation";
import {
  useKeyboardNavigation,
  useScreenReaderAnnouncements,
} from "../hooks/useKeyboardNavigation";

export const KanbanBoard: React.FC = () => {
  const t = useTranslations("kanban");
  const tCommon = useTranslations("common");
  const {
    tasks,
    getTasksByStatus,
    moveTask,
    updateTask,
    deleteTask,
    addTask,
    currentSprint,
  } = useKanban();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSprintManager, setShowSprintManager] = useState(false);

  // Hook para automação baseada em PRs
  const { checkPRStatusesManually, confirmationState } = usePRAutomation({
    tasks,
    updateTask,
  });

  // Screen reader announcements
  const { announce } = useScreenReaderAnnouncements();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = getTasksByStatus(TaskStatus.BACKLOG)
      .concat(getTasksByStatus(TaskStatus.IN_PROGRESS))
      .concat(getTasksByStatus(TaskStatus.COMPLETED))
      .find((t) => t.id === active.id);

    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) {
      // Se a tarefa foi solta fora das colunas, não fazemos nada
      // A tarefa permanece em sua posição original
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Verificar se o destino é uma coluna válida
    const validStatuses = [
      TaskStatus.BACKLOG,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
    ];
    let targetStatus: TaskStatus | null = null;

    // Se foi solto diretamente sobre uma coluna
    if (validStatuses.includes(overId as TaskStatus)) {
      targetStatus = overId as TaskStatus;
    } else {
      // Se foi solto sobre uma tarefa, encontrar a coluna da tarefa de destino
      const targetTask = tasks.find((task) => task.id === overId);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }

    if (targetStatus) {
      // Só mover se o status for diferente do atual
      const currentTask = tasks.find((task) => task.id === taskId);
      if (currentTask && currentTask.status !== targetStatus) {
        moveTask(taskId, targetStatus);
        const statusName =
          targetStatus === TaskStatus.BACKLOG
            ? "Backlog"
            : targetStatus === TaskStatus.IN_PROGRESS
            ? "Em andamento"
            : "Concluída";
        announce(`Tarefa "${currentTask.title}" movida para ${statusName}`);
      }
    }
    // Se não conseguiu determinar o destino, a tarefa permanece na posição original
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskSave = (taskData: Partial<Task>) => {
    if (selectedTask) {
      updateTask(selectedTask.id, taskData);
    } else {
      // Criar nova tarefa
      addTask({
        title: taskData.title || "",
        description: taskData.description || "",
        status: taskData.status || TaskStatus.BACKLOG,
        storyPoints: taskData.storyPoints || 0,
        assignedTo: taskData.assignedTo,
        sprintId: taskData.sprintId,
      });
    }
  };

  const handleTaskDelete = (taskId: string) => {
    if (selectedTask) {
      deleteTask(taskId);
    }
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
    announce(t("newTask"));
  };

  const handleTaskSelectFromSearch = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    announce(`${tCommon("edit")}: ${task.title}`);
  };

  // Keyboard navigation
  useKeyboardNavigation({
    onKeyN: handleAddTask,
    onSlash: () => {
      const searchInput = document.querySelector(
        'input[type="text"]'
      ) as HTMLInputElement;
      searchInput?.focus();
    },
    onEscape: () => {
      if (isModalOpen) {
        setIsModalOpen(false);
        setSelectedTask(null);
      }
    },
  });

  const backlogTasks = getTasksByStatus(TaskStatus.BACKLOG);
  const inProgressTasks = getTasksByStatus(TaskStatus.IN_PROGRESS);
  const completedTasks = getTasksByStatus(TaskStatus.COMPLETED);

  // Render functions for better performance
  const renderCurrentSprintInfo = () => {
    if (!currentSprint) return null;

    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentSprint.name}
            </h3>
            <p className="text-sm text-gray-600">{currentSprint.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {new Date(currentSprint.startDate).toLocaleDateString("pt-BR")} -{" "}
              {new Date(currentSprint.endDate).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentSprint.status === "active" ? "🟢 Ativo" : "⏸️ Pausado"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderDragOverlay = () => {
    if (!activeTask) return null;

    return (
      <div className="rotate-3 opacity-90 scale-105 shadow-2xl">
        <TaskCard task={activeTask} onClick={() => {}} />
      </div>
    );
  };

  const renderKanbanContent = () => {
    if (showSprintManager) return <SprintManager />;

    return (
      <>
        <SearchBar onTaskSelect={handleTaskSelectFromSearch} />

        {renderCurrentSprintInfo()}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Column
              title={t("columns.backlog")}
              status={TaskStatus.BACKLOG}
              tasks={backlogTasks}
              onTaskClick={handleTaskClick}
            />
            <Column
              title={t("columns.inProgress")}
              status={TaskStatus.IN_PROGRESS}
              tasks={inProgressTasks}
              onTaskClick={handleTaskClick}
            />
            <Column
              title={t("columns.completed")}
              status={TaskStatus.COMPLETED}
              tasks={completedTasks}
              onTaskClick={handleTaskClick}
            />
          </div>

          <DragOverlay>{renderDragOverlay()}</DragOverlay>
        </DndContext>

        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      </>
    );
  };

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <div className="flex items-center gap-3">
            <KeyboardShortcuts />
            <LanguageSelector />
            <button
              onClick={() => setShowSprintManager(!showSprintManager)}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Gerenciar Sprints"
              aria-label="Gerenciar Sprints"
            >
              🏃‍♂️ Sprints
            </button>
            <button
              onClick={checkPRStatusesManually}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              title={t("syncPRsTooltip")}
              aria-label={t("syncPRsTooltip")}
            >
              🔄 {t("syncPRs")}
            </button>
            <button
              onClick={handleAddTask}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t("newTask")}
            >
              + {t("newTask")}
            </button>
          </div>
        </div>
      </header>

      <GitHubStatus />

      {renderKanbanContent()}

      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        type={confirmationState.type}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
      />
    </div>
  );
};
