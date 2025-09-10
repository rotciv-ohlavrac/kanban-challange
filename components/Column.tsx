"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "../types";

interface ColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusColors = {
  [TaskStatus.BACKLOG]: "bg-slate-50 border-slate-200",
  [TaskStatus.IN_PROGRESS]: "bg-blue-50 border-blue-200",
  [TaskStatus.COMPLETED]: "bg-emerald-50 border-emerald-200",
};

const statusTextColors = {
  [TaskStatus.BACKLOG]: "text-slate-800",
  [TaskStatus.IN_PROGRESS]: "text-blue-800",
  [TaskStatus.COMPLETED]: "text-emerald-800",
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

  return (
    <div className="flex-1 min-w-80">
      <div className={`p-4 rounded-t-lg border-2 ${statusColors[status]}`}>
        <h2 className={`font-bold text-lg ${statusTextColors[status]}`}>
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
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma tarefa nesta coluna
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
