import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel, extractReasoningMiddleware } from "ai";

import { env } from "@/lib/env";

// Derive native Ollama base from the OpenAI-compat URL:
// "http://localhost:11434/v1" → "http://localhost:11434/api/chat"
const OLLAMA_NATIVE_URL =
  env.aiBaseUrl.replace(/\/v1\/?$/, "") + "/api/chat";

const enc = new TextEncoder();
const dec = new TextDecoder();

function sseChunk(
  id: string,
  created: number,
  model: string,
  delta: Record<string, unknown>,
  finishReason: string | null,
): string {
  return (
    "data: " +
    JSON.stringify({
      id,
      object: "chat.completion.chunk",
      created,
      model,
      choices: [{ index: 0, delta, finish_reason: finishReason }],
    }) +
    "\n\n"
  );
}

type OllamaToolCall = {
  function: { name: string; arguments: Record<string, unknown> | string };
};

type OllamaMessage = {
  role?: string;
  content?: string;
  thinking?: string;
  tool_calls?: OllamaToolCall[];
};

type OllamaChunk = {
  model?: string;
  message?: OllamaMessage;
  done?: boolean;
  done_reason?: string;
};

type RawMessage = Record<string, unknown>;

// Normalize OpenAI-format messages to Ollama native format.
// Key differences:
//  - tool_calls.function.arguments: OpenAI = JSON string, Ollama = object
//  - assistant content: OpenAI allows null, Ollama expects ""
//  - tool result content: OpenAI may send array, Ollama expects string
function normalizeMessages(messages: unknown[]): RawMessage[] {
  return (messages as RawMessage[]).map((msg) => {
    // Assistant messages with tool_calls
    if (msg.role === "assistant") {
      const toolCalls = msg.tool_calls as RawMessage[] | undefined;
      return {
        ...msg,
        content: msg.content ?? "",
        ...(toolCalls?.length
          ? {
              tool_calls: toolCalls.map((tc) => {
                const fn = tc.function as Record<string, unknown> | undefined;
                if (!fn) return tc;
                const args = fn.arguments;
                return {
                  ...tc,
                  function: {
                    ...fn,
                    arguments:
                      typeof args === "string"
                        ? (() => {
                            try {
                              return JSON.parse(args);
                            } catch {
                              return {};
                            }
                          })()
                        : args,
                  },
                };
              }),
            }
          : {}),
      };
    }

    // Tool result messages — ensure content is a plain string
    if (msg.role === "tool") {
      const raw = msg.content;
      let content: string;
      if (typeof raw === "string") {
        content = raw;
      } else if (Array.isArray(raw)) {
        content = (raw as RawMessage[])
          .map((c) => {
            if (c.type === "text") return c.text as string;
            if (c.type === "tool-result") {
              const r = c.result;
              return typeof r === "string" ? r : JSON.stringify(r);
            }
            return JSON.stringify(c);
          })
          .join("\n");
      } else {
        content = raw != null ? JSON.stringify(raw) : "";
      }
      return { ...msg, content };
    }

    return msg;
  });
}

// Wraps Ollama native streaming response into OpenAI SSE format.
// thinking tokens → <think>…</think> so extractReasoningMiddleware can pick them up.
function wrapAsOpenAIStream(ollamaResp: Response, model: string): Response {
  const id = `chatcmpl-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  let thinkOpen = false;
  let buf = "";
  let headerSent = false;

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parsed: OllamaChunk;
        try {
          parsed = JSON.parse(trimmed) as OllamaChunk;
        } catch {
          continue;
        }

        const msg = parsed.message;

        // Emit role header on first chunk
        if (!headerSent) {
          headerSent = true;
          ctrl.enqueue(
            enc.encode(sseChunk(id, created, model, { role: "assistant", content: "" }, null)),
          );
        }

        let emit = "";

        // Thinking content → wrapped in <think> tags
        if (msg?.thinking) {
          if (!thinkOpen) {
            thinkOpen = true;
            emit += "<think>";
          }
          emit += msg.thinking;
        }

        // Regular content — close think tag if still open
        if (msg?.content) {
          if (thinkOpen) {
            thinkOpen = false;
            emit += "</think>";
          }
          emit += msg.content;
        }

        if (emit) {
          ctrl.enqueue(enc.encode(sseChunk(id, created, model, { content: emit }, null)));
        }

        // Tool calls — convert Ollama format to OpenAI delta format
        if (msg?.tool_calls?.length) {
          const toolCallDelta = msg.tool_calls.map((tc, i) => ({
            index: i,
            id: `call_${Date.now()}_${i}`,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments:
                typeof tc.function.arguments === "string"
                  ? tc.function.arguments
                  : JSON.stringify(tc.function.arguments),
            },
          }));
          ctrl.enqueue(
            enc.encode(sseChunk(id, created, model, { tool_calls: toolCallDelta }, null)),
          );
        }

        if (parsed.done) {
          // Close any open think block
          if (thinkOpen) {
            ctrl.enqueue(
              enc.encode(sseChunk(id, created, model, { content: "</think>" }, null)),
            );
          }
          ctrl.enqueue(
            enc.encode(
              sseChunk(id, created, model, {}, parsed.done_reason ?? "stop"),
            ),
          );
          ctrl.enqueue(enc.encode("data: [DONE]\n\n"));
        }
      }
    },
  });

  return new Response(ollamaResp.body!.pipeThrough(transform), {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

// Custom fetch that intercepts /chat/completions and redirects to Ollama native
// API when thinking is enabled. Passes through all other requests unchanged.
const nativeFetch: typeof globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : (input as Request).url;

  const isChatCompletion = new URL(url).pathname.endsWith("/chat/completions");

  if (isChatCompletion && env.aiThinkLevel !== "off") {
    const body = JSON.parse((init?.body as string | undefined) ?? "{}") as {
      model: string;
      messages: unknown[];
      temperature?: number;
      tools?: unknown[];
      stream?: boolean;
    };

    // Only intercept streaming chat requests. Non-streaming calls (generateObject,
    // doGenerate) must pass through to the OpenAI-compat endpoint as-is — the
    // native API always streams, which breaks JSON response parsing.
    if (body.stream !== true) {
      return globalThis.fetch(input, init);
    }

    const ollamaBody: Record<string, unknown> = {
      model: body.model,
      messages: normalizeMessages(body.messages),
      stream: true,
      think: env.aiThinkLevel,
    };

    if (body.tools?.length) {
      ollamaBody.tools = body.tools;
    }

    if (body.temperature != null) {
      ollamaBody.options = { temperature: body.temperature };
    }

    const resp = await globalThis.fetch(OLLAMA_NATIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaBody),
      signal: init?.signal ?? undefined,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("[AI proxy] Ollama native error", resp.status, errText);
      return new Response(errText, { status: resp.status, headers: { "Content-Type": "application/json" } });
    }

    return wrapAsOpenAIStream(resp, body.model);
  }

  return globalThis.fetch(input, init);
};

const openai = createOpenAI({
  baseURL: env.aiBaseUrl,
  apiKey: env.aiApiKey,
  name: "au-asistan-ai",
  fetch: nativeFetch,
});

export function getChatModel() {
  return wrapLanguageModel({
    model: openai.chat(env.aiChatModel),
    middleware: extractReasoningMiddleware({ tagName: "think" }),
  });
}

export function getEmbeddingModel() {
  return openai.textEmbeddingModel(env.aiEmbeddingModel);
}
