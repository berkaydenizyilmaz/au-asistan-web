"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api/client";

import type { CronJobStatus, CronRunDTO } from "../lib/queries";
import type { CronJobName } from "../lib/cron-jobs";

interface CronJobsClientProps {
  jobs: CronJobStatus[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function JobCard({
  job,
  t,
  onRunComplete,
}: {
  job: CronJobStatus;
  t: ReturnType<typeof useTranslations<"admin.cron">>;
  onRunComplete: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<CronRunDTO[] | null>(null);

  const jobNameKey = `job${job.name.charAt(0).toUpperCase()}${job.name.slice(1)}` as
    | "jobMeals"
    | "jobAnnouncements"
    | "jobEvents"
    | "jobCalendar"
    | "jobKnowledge";

  async function handleRun() {
    setRunning(true);
    try {
      await apiFetch(`/api/admin/cron/${job.name}/run`, { method: "POST" });
      toast.success(t("runSuccess", { job: t(jobNameKey) }));
      onRunComplete();
    } catch {
      toast.error(t("runFailed", { job: t(jobNameKey) }));
    } finally {
      setRunning(false);
    }
  }

  async function toggleHistory() {
    if (!historyOpen && history === null) {
      setHistoryLoading(true);
      try {
        const data = await apiFetch(`/api/admin/cron/${job.name}/runs?limit=20`);
        setHistory((data as { data: CronRunDTO[] }).data);
      } catch {
        toast.error(t("runFailed", { job: t(jobNameKey) }));
      } finally {
        setHistoryLoading(false);
      }
    }
    setHistoryOpen((v) => !v);
  }

  const lastRun = job.lastRun;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t(jobNameKey)}</CardTitle>
          {lastRun ? (
            <Badge
              variant={lastRun.status === "success" ? "default" : "destructive"}
              className="text-xs"
            >
              {lastRun.status === "success" ? t("statusSuccess") : t("statusError")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {t("neverRun")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1 text-sm">
        {lastRun ? (
          <>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("lastRun")}</span>
              <span>{formatDate(lastRun.completedAt)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("durationMs")}</span>
              <span>{lastRun.durationMs.toLocaleString("tr-TR")} ms</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("resultCount")}</span>
              <span>{lastRun.resultCount.toLocaleString("tr-TR")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("triggeredBy")}</span>
              <span>
                {lastRun.triggeredBy === "cron"
                  ? t("triggeredByCron")
                  : t("triggeredByAdmin")}
              </span>
            </div>
            {lastRun.errorMessage && (
              <p className="text-xs text-destructive mt-1 break-all">
                {lastRun.errorMessage}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">{t("neverRun")}</p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-2 pt-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={running}
            onClick={handleRun}
          >
            {running ? t("running") : t("runNow")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={historyLoading}
            onClick={toggleHistory}
          >
            {historyOpen ? t("hideHistory") : t("viewHistory")}
          </Button>
        </div>

        {historyOpen && (
          <div className="border rounded-md overflow-hidden mt-1">
            {historyLoading ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {t("running")}
              </p>
            ) : !history || history.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {t("noRuns")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px] text-xs">{t("statusHeader")}</TableHead>
                    <TableHead className="text-xs">{t("lastRun")}</TableHead>
                    <TableHead className="w-[80px] text-xs">{t("durationMs")}</TableHead>
                    <TableHead className="w-[80px] text-xs">{t("resultCount")}</TableHead>
                    <TableHead className="w-[70px] text-xs">{t("triggeredBy")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === "success" ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {run.status === "success"
                            ? t("statusSuccess")
                            : t("statusError")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(run.completedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {run.durationMs.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {run.resultCount.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {run.triggeredBy === "cron"
                          ? t("triggeredByCron")
                          : t("triggeredByAdmin")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function CronJobsClient({ jobs }: CronJobsClientProps) {
  const t = useTranslations("admin.cron");
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {jobs.map((job) => (
        <JobCard
          key={job.name}
          job={job}
          t={t}
          onRunComplete={() => router.refresh()}
        />
      ))}
    </div>
  );
}

export type { CronJobName };
