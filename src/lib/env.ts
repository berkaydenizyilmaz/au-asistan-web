function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  supabaseAnonKey: requireEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
  cronSecret: process.env.CRON_SECRET ?? "",

  aiBaseUrl: process.env.AI_BASE_URL ?? "http://localhost:11434/v1",
  aiApiKey: process.env.AI_API_KEY ?? "ollama",
  aiChatModel: process.env.AI_CHAT_MODEL ?? "gemma4:latest",

  aiEmbeddingModel:
    process.env.AI_EMBEDDING_MODEL ?? "qwen3-embedding:4b",
  aiEmbeddingDimensions: Number(
    process.env.AI_EMBEDDING_DIMENSIONS ?? "2560"
  ),
} as const;
