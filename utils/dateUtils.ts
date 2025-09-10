// Utilitários para trabalhar com datas e dias úteis

export const calculateWorkingDays = (
  startDate: Date,
  endDate: Date
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  // Normalizar as datas para o início do dia
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

export const addWorkingDays = (startDate: Date, workingDays: number): Date => {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Se não for fim de semana, conta como dia útil
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return result;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isWorkingDay = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
};

export const getWorkingDaysBetween = (
  startDate: Date,
  endDate: Date
): Date[] => {
  const workingDays: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (isWorkingDay(current)) {
      workingDays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

export const getSprintProgress = (sprint: {
  startDate: Date;
  endDate: Date;
  workingDays: number;
}): {
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  progressPercentage: number;
} => {
  const now = new Date();
  const totalDays = sprint.workingDays;

  let elapsedDays = 0;
  if (now >= sprint.startDate) {
    elapsedDays = Math.min(
      calculateWorkingDays(sprint.startDate, now),
      totalDays
    );
  }

  const remainingDays = Math.max(0, totalDays - elapsedDays);
  const progressPercentage =
    totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    progressPercentage: Math.min(100, progressPercentage),
  };
};
