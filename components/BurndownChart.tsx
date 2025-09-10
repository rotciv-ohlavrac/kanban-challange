"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Sprint, Task, TaskStatus } from "../types";
import { getWorkingDaysBetween, formatDate } from "../utils/dateUtils";

interface BurndownChartProps {
  sprint: Sprint;
  tasks: Task[];
}

interface BurndownDataPoint {
  date: string;
  dateFormatted: string;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  sprint,
  tasks,
}) => {
  const t = useTranslations("sprint");
  const tPoints = useTranslations("storyPoints");

  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id);
  const totalPoints = sprintTasks.reduce(
    (sum, task) => sum + task.storyPoints,
    0
  );

  const burndownData = useMemo(() => {
    const workingDays = getWorkingDaysBetween(sprint.startDate, sprint.endDate);
    const data: BurndownDataPoint[] = [];

    workingDays.forEach((date, index) => {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Ideal burndown - linear decrease
      const idealRemaining =
        totalPoints - (totalPoints * (index + 1)) / workingDays.length;

      // Actual burndown - based on completed tasks
      const completedTasks = sprintTasks.filter(
        (task) =>
          task.status === TaskStatus.COMPLETED &&
          task.completedAt &&
          task.completedAt <= dayEnd
      );

      const completedPoints = completedTasks.reduce(
        (sum, task) => sum + task.storyPoints,
        0
      );
      const actualRemaining = totalPoints - completedPoints;

      data.push({
        date: date.toISOString().split("T")[0],
        dateFormatted: formatDate(date),
        idealRemaining: Math.max(0, idealRemaining),
        actualRemaining: Math.max(0, actualRemaining),
        completed: completedPoints,
      });
    });

    return data;
  }, [sprint, sprintTasks, totalPoints]);

  const currentDate = new Date();
  const isSprintActive =
    currentDate >= sprint.startDate && currentDate <= sprint.endDate;
  const currentDataPoint = isSprintActive
    ? burndownData.find((point) => new Date(point.date) <= currentDate)
    : burndownData[burndownData.length - 1];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.dateFormatted}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">
                Ideal: {data.idealRemaining} {tPoints("points")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">
                Real: {data.actualRemaining} {tPoints("points")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">
                {tPoints("completed")}: {data.completed} {tPoints("points")}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (sprintTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t("burndown")}
        </h3>
        <div className="text-center py-8 text-gray-500">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>Nenhuma tarefa no sprint</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("burndown")} - {sprint.name}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{tPoints("total")}:</span>
              <span className="ml-1 font-medium">
                {totalPoints} {tPoints("points")}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{tPoints("completed")}:</span>
              <span className="ml-1 font-medium text-green-600">
                {currentDataPoint?.completed || 0} {tPoints("points")}
              </span>
            </div>
            <div>
              <span className="text-gray-500">{tPoints("remaining")}:</span>
              <span className="ml-1 font-medium text-red-600">
                {currentDataPoint?.actualRemaining || totalPoints}{" "}
                {tPoints("points")}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </div>
          <div className="text-sm font-medium mt-1">
            {sprint.workingDays} dias úteis
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={burndownData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateFormatted"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: tPoints("points"),
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="idealRemaining"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Burndown Ideal"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="actualRemaining"
              stroke="#ef4444"
              strokeWidth={3}
              name="Burndown Real"
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sprint Status Indicator */}
      <div className="mt-4 flex justify-center">
        <div
          className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
          ${
            sprint.status === "active"
              ? "bg-green-100 text-green-800"
              : sprint.status === "completed"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }
        `}
        >
          <div
            className={`
            w-2 h-2 rounded-full mr-2
            ${
              sprint.status === "active"
                ? "bg-green-500"
                : sprint.status === "completed"
                ? "bg-blue-500"
                : "bg-gray-500"
            }
          `}
          ></div>
          {t(sprint.status)}
        </div>
      </div>
    </div>
  );
};
