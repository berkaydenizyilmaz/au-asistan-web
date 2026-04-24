import "server-only";

import { embed, embedMany } from "ai";

import { getEmbeddingModel } from "@/lib/ai/provider";
import { AppError } from "@/lib/errors";

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: getEmbeddingModel(),
      value: text,
    });
    return embedding;
  } catch {
    throw new AppError({ code: "EMBEDDING_FAILED", message: "Embedding üretilemedi", statusCode: 500 });
  }
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    const { embeddings } = await embedMany({
      model: getEmbeddingModel(),
      values: texts,
    });
    return embeddings;
  } catch {
    throw new AppError({ code: "EMBEDDING_FAILED", message: "Batch embedding üretilemedi", statusCode: 500 });
  }
}
