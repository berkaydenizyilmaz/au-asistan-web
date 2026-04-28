import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { authUsers } from "drizzle-orm/supabase";

import { requireAdmin } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { conversations, messageFeedback, messages } from "@/lib/db/schema/chat";
import { cronRuns } from "@/lib/db/schema/cron";
import { users } from "@/lib/db/schema/users";
import { parseOrThrow } from "@/lib/validation";

import {
  CRON_JOB_NAMES,
  type CronJobName,
} from "./cron-jobs";
import { adminFeedbackQuerySchema, analyticsRangeSchema } from "./validators";
import type { AnalyticsRange } from "./validators";

export interface FeedbackListItem {
  feedbackId: string;
  rating: "up" | "down";
  feedbackCreatedAt: string;
  messageId: string;
  conversationId: string;
  assistantContent: string;
  userQuestion: string | null;
  hasFallback: boolean;
  responseTimeMs: number | null;
}

export interface FeedbackListResult {
  items: FeedbackListItem[];
  total: number;
}

export interface FeedbackFilters {
  rating?: "up" | "down";
  onlyFallback?: boolean;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string | null;
  role: "user" | "admin";
  createdAt: string;
}

export async function listUsersForAdmin(pagination: {
  page: number;
  pageSize: number;
}): Promise<{ items: AdminUserListItem[]; total: number }> {
  await requireAdmin();

  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const db = await createDrizzleSupabaseClient();

  const [rows, countRows] = await Promise.all([
    db.admin
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        email: authUsers.email,
      })
      .from(users)
      .innerJoin(authUsers, eq(users.id, authUsers.id))
      .orderBy(desc(users.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.admin.select({ total: sql<number>`count(*)::int` }).from(users),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email ?? null,
      role: row.role as "user" | "admin",
      createdAt: row.createdAt.toISOString(),
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export async function listFeedbackForAdmin(
  filters: FeedbackFilters,
  pagination: { page: number; pageSize: number }
): Promise<FeedbackListResult> {
  await requireAdmin();

  const { page, pageSize } = parseOrThrow(
    adminFeedbackQuerySchema.pick({ page: true, pageSize: true }),
    pagination,
    "Invalid pagination"
  );

  const db = await createDrizzleSupabaseClient();

  const conditions: SQL[] = [];
  if (filters.rating === "up" || filters.rating === "down") {
    conditions.push(eq(messageFeedback.rating, filters.rating));
  }
  if (filters.onlyFallback) {
    conditions.push(eq(messages.hasFallback, true));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * pageSize;

  const [rows, countRows] = await Promise.all([
    db.admin
      .select({
        feedbackId: messageFeedback.id,
        rating: messageFeedback.rating,
        feedbackCreatedAt: messageFeedback.createdAt,
        messageId: messages.id,
        conversationId: messages.conversationId,
        assistantContent: messages.content,
        hasFallback: messages.hasFallback,
        responseTimeMs: messages.responseTimeMs,
        userQuestion: sql<string | null>`(
          SELECT content FROM messages AS prev
          WHERE prev.conversation_id = messages.conversation_id
            AND prev.role = 'user'
            AND prev.created_at < messages.created_at
          ORDER BY prev.created_at DESC
          LIMIT 1
        )`,
      })
      .from(messageFeedback)
      .innerJoin(messages, eq(messages.id, messageFeedback.messageId))
      .where(whereClause)
      .orderBy(desc(messageFeedback.createdAt))
      .limit(pageSize)
      .offset(offset),

    db.admin
      .select({ total: sql<number>`count(*)::int` })
      .from(messageFeedback)
      .innerJoin(messages, eq(messages.id, messageFeedback.messageId))
      .where(whereClause),
  ]);

  return {
    items: rows.map((row) => ({
      feedbackId: row.feedbackId,
      rating: row.rating as "up" | "down",
      feedbackCreatedAt: row.feedbackCreatedAt.toISOString(),
      messageId: row.messageId,
      conversationId: row.conversationId,
      assistantContent: row.assistantContent,
      userQuestion: row.userQuestion ?? null,
      hasFallback: row.hasFallback,
      responseTimeMs: row.responseTimeMs ?? null,
    })),
    total: countRows[0]?.total ?? 0,
  };
}

export interface AnalyticsDTO {
  range: AnalyticsRange;
  questions: number;
  answers: number;
  fallback: { count: number; rate: number };
  avgResponseTimeMs: number | null;
  toolUsage: { count: number; rate: number };
  feedback: { up: number; down: number; total: number; positiveRate: number };
  activeUsers: number;
  conversations: number;
  avgChunkCount: number | null;
}

function computeSinceDate(range: AnalyticsRange): Date | null {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - (range === "7d" ? 7 : 30));
  return d;
}

export async function getAnalyticsForAdmin(
  range: AnalyticsRange
): Promise<AnalyticsDTO> {
  await requireAdmin();

  const validRange = parseOrThrow(analyticsRangeSchema, range, "Invalid range") as AnalyticsRange;
  const since = computeSinceDate(validRange);
  const db = await createDrizzleSupabaseClient();

  const [msgStats, feedbackStats, convStats] = await Promise.all([
    db.admin
      .select({
        questions: sql<number>`count(*) FILTER (WHERE ${messages.role} = 'user')::int`,
        answers: sql<number>`count(*) FILTER (WHERE ${messages.role} = 'assistant')::int`,
        fallbackCount: sql<number>`count(*) FILTER (WHERE ${messages.role} = 'assistant' AND ${messages.hasFallback} = true)::int`,
        avgResponseTimeMs: sql<string | null>`avg(${messages.responseTimeMs}) FILTER (WHERE ${messages.role} = 'assistant' AND ${messages.responseTimeMs} IS NOT NULL)`,
        toolUsageCount: sql<number>`count(*) FILTER (WHERE ${messages.role} = 'assistant' AND ${messages.toolCalls} IS NOT NULL)::int`,
        avgChunkCount: sql<string | null>`avg(${messages.chunkCount}) FILTER (WHERE ${messages.role} = 'assistant' AND ${messages.chunkCount} IS NOT NULL)`,
      })
      .from(messages)
      .where(since ? gte(messages.createdAt, since) : undefined),

    db.admin
      .select({
        up: sql<number>`count(*) FILTER (WHERE ${messageFeedback.rating} = 'up')::int`,
        down: sql<number>`count(*) FILTER (WHERE ${messageFeedback.rating} = 'down')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(messageFeedback)
      .where(since ? gte(messageFeedback.createdAt, since) : undefined),

    db.admin
      .select({
        total: sql<number>`count(*)::int`,
        activeUsers: sql<number>`count(distinct ${conversations.userId})::int`,
      })
      .from(conversations)
      .where(since ? gte(conversations.createdAt, since) : undefined),
  ]);

  const answers = msgStats[0]?.answers ?? 0;
  const fallbackCount = msgStats[0]?.fallbackCount ?? 0;
  const toolUsageCount = msgStats[0]?.toolUsageCount ?? 0;
  const up = feedbackStats[0]?.up ?? 0;
  const down = feedbackStats[0]?.down ?? 0;
  const total = feedbackStats[0]?.total ?? 0;
  const rawAvgMs = msgStats[0]?.avgResponseTimeMs;
  const rawAvgChunk = msgStats[0]?.avgChunkCount;

  return {
    range: validRange,
    questions: msgStats[0]?.questions ?? 0,
    answers,
    fallback: {
      count: fallbackCount,
      rate: answers > 0 ? Math.round((fallbackCount / answers) * 1000) / 10 : 0,
    },
    avgResponseTimeMs:
      rawAvgMs != null ? Math.round(Number(rawAvgMs)) : null,
    toolUsage: {
      count: toolUsageCount,
      rate: answers > 0 ? Math.round((toolUsageCount / answers) * 1000) / 10 : 0,
    },
    feedback: {
      up,
      down,
      total,
      positiveRate: total > 0 ? Math.round((up / total) * 1000) / 10 : 0,
    },
    activeUsers: convStats[0]?.activeUsers ?? 0,
    conversations: convStats[0]?.total ?? 0,
    avgChunkCount:
      rawAvgChunk != null ? Math.round(Number(rawAvgChunk) * 10) / 10 : null,
  };
}

export interface CronRunDTO {
  id: string;
  job: CronJobName;
  status: "success" | "error";
  startedAt: string;
  completedAt: string;
  durationMs: number;
  resultCount: number;
  errorMessage: string | null;
  triggeredBy: "cron" | "admin";
}

export interface CronJobStatus {
  name: CronJobName;
  lastRun: CronRunDTO | null;
}

export async function listCronJobsForAdmin(): Promise<CronJobStatus[]> {
  await requireAdmin();

  const db = await createDrizzleSupabaseClient();

  const lastRuns = await db.admin
    .selectDistinctOn([cronRuns.job], {
      id: cronRuns.id,
      job: cronRuns.job,
      status: cronRuns.status,
      startedAt: cronRuns.startedAt,
      completedAt: cronRuns.completedAt,
      durationMs: cronRuns.durationMs,
      resultCount: cronRuns.resultCount,
      errorMessage: cronRuns.errorMessage,
      triggeredBy: cronRuns.triggeredBy,
    })
    .from(cronRuns)
    .orderBy(cronRuns.job, desc(cronRuns.completedAt));

  const lastRunMap = new Map(lastRuns.map((r) => [r.job, r]));

  return CRON_JOB_NAMES.map((name) => {
    const run = lastRunMap.get(name);
    return {
      name,
      lastRun: run
        ? {
            id: run.id,
            job: run.job as CronJobName,
            status: run.status as "success" | "error",
            startedAt: run.startedAt.toISOString(),
            completedAt: run.completedAt.toISOString(),
            durationMs: run.durationMs,
            resultCount: run.resultCount,
            errorMessage: run.errorMessage ?? null,
            triggeredBy: run.triggeredBy as "cron" | "admin",
          }
        : null,
    };
  });
}

export async function listCronRuns(
  job: CronJobName,
  limit = 20
): Promise<CronRunDTO[]> {
  await requireAdmin();

  const db = await createDrizzleSupabaseClient();

  const rows = await db.admin
    .select()
    .from(cronRuns)
    .where(eq(cronRuns.job, job))
    .orderBy(desc(cronRuns.completedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    job: r.job as CronJobName,
    status: r.status as "success" | "error",
    startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt.toISOString(),
    durationMs: r.durationMs,
    resultCount: r.resultCount,
    errorMessage: r.errorMessage ?? null,
    triggeredBy: r.triggeredBy as "cron" | "admin",
  }));
}
