"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cva } from "class-variance-authority";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "../types";

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// Column Header Variants
const columnHeaderStyles = cva(["p-4", "rounded-t-lg", "border-2"], {
  variants: {
    status: {
      backlog: ["bg-slate-50", "border-slate-200"],
      "in-progress": ["bg-blue-50", "border-blue-200"],
      completed: ["bg-emerald-50", "border-emerald-200"],
    },
  },
});

// Column Title Variants
const columnTitleStyles = cva(["font-bold", "text-lg"], {
  variants: {
    status: {
      backlog: ["text-slate-800"],
      "in-progress": ["text-blue-800"],
      completed: ["text-emerald-800"],
    },
  },
});

const getStatusVariant = (status: TaskStatus) => {
  return status === TaskStatus.BACKLOG
    ? "backlog"
    : status === TaskStatus.IN_PROGRESS
    ? "in-progress"
    : "completed";
};

export const Column: React.FC<ColumnProps> = ({
  title,
  status,
  tasks,
  onTaskClick,
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const statusVariant = getStatusVariant(status);

  // Render functions for better performance
  const renderTaskIds = () => {
    return tasks.map((task) => task.id);
  };

  const renderTasksList = () => {
    return tasks.map((task) => (
      <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
    ));
  };

  const renderTasksContent = () => {
    if (tasks.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          Nenhuma tarefa nesta coluna
        </div>
      );
    }

    return renderTasksList();
  };

  return (
    <div className="flex-1 min-w-80">
      <div className={columnHeaderStyles({ status: statusVariant })}>
        <h2 className={columnTitleStyles({ status: statusVariant })}>
          {title}
        </h2>
        <span className="text-sm text-gray-600">
          {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="min-h-96 p-4 bg-white border-2 border-t-0 border-gray-200 rounded-b-lg shadow-sm"
      >
        <SortableContext
          items={renderTaskIds()}
          strategy={verticalListSortingStrategy}
        >
          {renderTasksContent()}
        </SortableContext>
      </div>
    </div>
  );
};
