import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Task, TASK_STATUS_CONFIG } from "../types";
import { UnifiedGitHubService } from "../services/unifiedGitHubService";
import { useConfirmation } from "./useConfirmation";

interface UsePRAutomationProps {
  tasks: Task[];
  updateTask: (id: string, updates: Partial<Task>) => void;
}

export const usePRAutomation = ({
  tasks,
  updateTask,
}: UsePRAutomationProps) => {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  const githubService = UnifiedGitHubService.getInstance();
  const { showConfirmation, confirmationState } = useConfirmation();

  useEffect(() => {
    // Só executar se houver tarefas com PRs para evitar chamadas desnecessárias
    const tasksWithPRs = tasks.filter((task) => task.githubPR);
    if (tasksWithPRs.length === 0) return;

    console.log(
      `🔄 Configurando polling para ${tasksWithPRs.length} PR(s) - a cada 10 minutos`
    );

    const checkPRStatuses = async () => {
      // Filtrar tarefas que têm PRs vinculados
      const tasksWithPRs = tasks.filter((task) => task.githubPR);

      if (tasksWithPRs.length === 0) return;

      for (const task of tasksWithPRs) {
        if (!task.githubPR) continue;

        try {
          // Verificar status atual do PR
          const currentPR = await githubService.getPR(task.githubPR.number);

          if (!currentPR) continue;

          // Se o status do PR mudou
          if (currentPR.status !== task.githubPR.status) {
            console.log(
              `PR #${currentPR.number} mudou de status: ${task.githubPR.status} → ${currentPR.status}`
            );

            // Sugerir novo status para a tarefa
            const suggestedStatus = githubService.suggestTaskStatus(
              currentPR.status
            );

            // Atualizar PR na tarefa
            const updatedTask = {
              ...task,
              githubPR: currentPR,
            };

            // Se o status sugerido é diferente do atual, perguntar se deve mover
            if (suggestedStatus !== task.status) {
              const prStatusText =
                currentPR.status === "merged"
                  ? t("prStatusTypes.merged")
                  : currentPR.status === "closed"
                  ? t("prStatusTypes.closed")
                  : t("prStatusTypes.open");

              const shouldMove = await showConfirmation({
                title: t("prStatusChange", { number: currentPR.number }),
                message: t("prStatusChange", {
                  number: currentPR.number,
                  status: prStatusText,
                  title: task.title,
                  newStatus: TASK_STATUS_CONFIG[suggestedStatus].label,
                }),
                type: "info",
                confirmText: tCommon("confirm"),
                cancelText: tCommon("cancel"),
              });

              if (shouldMove) {
                updateTask(task.id, {
                  ...updatedTask,
                  status: suggestedStatus,
                });
              } else {
                updateTask(task.id, updatedTask);
              }
            } else {
              updateTask(task.id, updatedTask);
            }
          }
        } catch (error) {
          console.error(
            `Erro ao verificar PR #${task.githubPR.number}:`,
            error
          );
        }
      }
    };

    // Verificar status dos PRs a cada 10 minutos para evitar rate limiting
    const interval = setInterval(checkPRStatuses, 10 * 60 * 1000); // 10 minutos

    // Verificação inicial
    checkPRStatuses();

    return () => clearInterval(interval);
  }, [tasks, updateTask, githubService]);

  // Função para forçar verificação manual
  const checkPRStatusesManually = async () => {
    const tasksWithPRs = tasks.filter((task) => task.githubPR);
    let updatedCount = 0;

    for (const task of tasksWithPRs) {
      if (!task.githubPR) continue;

      try {
        const currentPR = await githubService.getPR(task.githubPR.number);

        if (currentPR && currentPR.status !== task.githubPR.status) {
          updateTask(task.id, {
            githubPR: currentPR,
          });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Erro ao verificar PR #${task.githubPR.number}:`, error);
      }
    }

    if (updatedCount > 0) {
      await showConfirmation({
        title: tCommon("success"),
        message: t("github.syncComplete", { count: updatedCount }),
        type: "info",
        confirmText: tCommon("close"),
      });
    } else {
      await showConfirmation({
        title: tCommon("success"),
        message: t("github.syncNoChanges"),
        type: "info",
        confirmText: tCommon("close"),
      });
    }
  };

  return {
    checkPRStatusesManually,
    confirmationState,
  };
};
