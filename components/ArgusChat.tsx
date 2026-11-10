"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type {
  AgentMessage,
  HealthResponse,
  PromptResponse,
  ToolCall,
  Turn,
} from "@/lib/types";

import { ArgusMark } from "./ArgusMark";

const SAMPLE_PROMPTS = [
  "Show all available products in the store.",
  "What currencies are supported by the Argus Field Supply?",
  "What current promotions are available on binoculars?",
];

const JAEGER_URL = (process.env.NEXT_PUBLIC_JAEGER_URL ?? "").replace(
  /\/$/,
  "",
);

const REPLAY_PROMPTS = new Set(SAMPLE_PROMPTS);

function roleOf(message: AgentMessage): string {
  return message.role ?? message.type ?? "";
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(textOf).join("\n");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function finalAnswer(messages: AgentMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const role = roleOf(message);
    if ((role === "assistant" || role === "ai") && !message.tool_calls?.length) {
      const content = textOf(message.content).trim();
      if (content) return content;
    }
  }
  return "";
}

function toolName(call: ToolCall): string {
  return call.function?.name ?? call.name ?? "tool";
}

function toolArguments(call: ToolCall): unknown {
  return call.function?.arguments ?? call.args ?? call.arguments;
}

function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

function collectToolCalls(messages: AgentMessage[]): ToolCall[] {
  return messages.flatMap((message) => message.tool_calls ?? []);
}

function collectToolResults(messages: AgentMessage[]): Map<string, string> {
  const results = new Map<string, string>();
  for (const message of messages) {
    if (roleOf(message) === "tool" && message.tool_call_id) {
      results.set(message.tool_call_id, textOf(message.content));
    }
  }
  return results;
}

function ModeBadge({ mode }: { mode: string }) {
  const label =
    mode === "replay"
      ? "REPLAY · NO API KEY"
      : mode === "live"
        ? "LIVE MODEL"
        : mode === "unavailable"
          ? "AGENT OFFLINE"
          : "CHECKING";

  const styles =
    mode === "replay"
      ? "border-amber-300/25 bg-amber-300/[0.07] text-amber-200"
      : mode === "live"
        ? "border-teal-300/25 bg-teal-300/[0.07] text-teal-200"
        : "border-white/10 bg-white/[0.03] text-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold tracking-[0.14em] ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[10px] text-slate-500">
      {label} <span className="text-slate-200">{value ?? 0}</span>
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 text-xs text-slate-500">
      <span className="flex gap-1">
        <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-amber-300" />
        <span
          className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-amber-300"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-amber-300"
          style={{ animationDelay: "300ms" }}
        />
      </span>
      Agent is choosing a tool…
    </div>
  );
}

function TracePanel({ turn }: { turn: Turn }) {
  const calls = collectToolCalls(turn.messages);
  const results = collectToolResults(turn.messages);

  return (
    <details className="group mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-xs text-slate-400 transition hover:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="font-mono text-amber-300">↳</span>
          Trace &amp; tools
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {turn.metrics.llm_calls ?? 0} LLM · {turn.metrics.tool_calls ?? 0}{" "}
          tools
          <span className="transition group-open:rotate-180">⌄</span>
        </span>
      </summary>

      <div className="border-t border-white/10 px-3.5 py-3.5">
        <div className="flex flex-wrap gap-2">
          <Metric label="messages" value={turn.metrics.messages} />
          <Metric label="llm calls" value={turn.metrics.llm_calls} />
          <Metric label="tool calls" value={turn.metrics.tool_calls} />
          <Metric
            label="est. tokens"
            value={turn.metrics.estimated_tokens}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">trace</span>
          <code className="rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-teal-200">
            {turn.traceId ?? "not returned"}
          </code>
          {turn.traceId && JAEGER_URL ? (
            <a
              className="font-medium text-amber-200 underline decoration-amber-300/30 underline-offset-4 transition hover:text-amber-100"
              href={`${JAEGER_URL}/trace/${turn.traceId}`}
              rel="noreferrer"
              target="_blank"
            >
              Open in Jaeger ↗
            </a>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          {calls.length === 0 ? (
            <p className="text-xs text-slate-500">
              No tool calls in this turn.
            </p>
          ) : (
            calls.map((call, index) => {
              const name = toolName(call);
              const args = toolArguments(call);
              const result = call.id ? results.get(call.id) : undefined;

              return (
                <div
                  className="rounded-lg border border-white/10 bg-black/20 p-3"
                  key={`${name}-${index}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-amber-200">
                      {name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-600">
                      tool {index + 1}
                    </span>
                  </div>

                  {args ? (
                    <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap break-words rounded bg-black/20 p-2 font-mono text-[10px] leading-4 text-slate-400">
                      {textOf(args)}
                    </pre>
                  ) : null}

                  {result ? (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      <p className="text-[9px] uppercase tracking-wider text-slate-600">
                        result
                      </p>
                      <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-4 text-slate-500">
                        {truncate(result, 900)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </details>
  );
}

function EmptyState({
  onPick,
}: {
  onPick: (prompt: string) => Promise<void>;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[0.06]">
        <ArgusMark className="h-8 w-8 text-amber-300" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-200">
        Pick a recorded prompt
      </p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
        Replay answers these three prompts. Every reply exposes the tool call,
        the trace ID, and the token estimate behind it.
      </p>
      <div className="mt-5 grid w-full max-w-md gap-2">
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            className="rounded-xl border border-white/10 bg-white/[0.025] px-3.5 py-2.5 text-left text-xs leading-5 text-slate-400 transition hover:border-amber-300/25 hover:bg-amber-300/[0.04] hover:text-slate-200"
            key={prompt}
            onClick={() => void onPick(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ArgusChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("checking");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json() as Promise<HealthResponse>)
      .then((data) => {
        if (active) setMode(data.mode ?? "unknown");
      })
      .catch(() => {
        if (active) setMode("unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (turns.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [turns]);

  async function sendPrompt(rawPrompt?: string) {
    const prompt = (rawPrompt ?? input).trim();
    if (!prompt || loading) return;

    if (mode === "replay" && (history.length > 0 || !REPLAY_PROMPTS.has(prompt))) {
      const id = crypto.randomUUID();
      setInput("");
      setTurns((current) => [
        ...current,
        {
          id,
          prompt,
          answer: "",
          messages: [],
          metrics: {},
          traceId: null,
          error:
            "This public demo is replay-only. Use “New chat” and pick one of the three recorded prompts. Live mode is a local operator feature.",
        },
      ]);
      return;
    }

    const id = crypto.randomUUID();
    setInput("");
    setLoading(true);
    setTurns((current) => [
      ...current,
      {
        id,
        prompt,
        answer: "",
        messages: [],
        metrics: {},
        traceId: null,
        pending: true,
      },
    ]);

    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: prompt, history }),
      });
      const data = (await response.json().catch(() => null)) as
        | PromptResponse
        | null;

      if (!response.ok || !data) {
        throw new Error(
          data?.detail ??
            data?.error ??
            `The agent request failed (${response.status}).`,
        );
      }

      const messages = data.response?.messages ?? [];
      const answer = finalAnswer(messages);

      setHistory(messages);
      setTurns((current) =>
        current.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                answer: answer || "The agent returned no text.",
                messages,
                metrics: data.metrics ?? {},
                traceId: data.trace_id ?? null,
                pending: false,
              }
            : turn,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setTurns((current) =>
        current.map((turn) =>
          turn.id === id ? { ...turn, error: message, pending: false } : turn,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendPrompt();
    }
  }

  function newChat() {
    setTurns([]);
    setHistory([]);
    setInput("");
  }

  return (
    <section className="flex h-[720px] max-h-[calc(100vh-7rem)] min-h-[560px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1118]/90 shadow-2xl shadow-black/40 backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Agent console
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-slate-500 transition hover:border-amber-300/25 hover:text-amber-200"
            onClick={newChat}
            type="button"
          >
            ↺ New chat
          </button>
          <ModeBadge mode={mode} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
        {turns.length === 0 ? <EmptyState onPick={sendPrompt} /> : null}

        <div className="space-y-5">
          {turns.map((turn) => (
            <div className="animate-rise space-y-3" key={turn.id}>
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-amber-300 px-4 py-2.5 text-sm font-medium leading-5 text-[#1a1204]">
                  {turn.prompt}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/[0.06]">
                  <ArgusMark className="h-4 w-4 text-amber-300" />
                </div>

                <div className="min-w-0 flex-1">
                  {turn.pending ? <TypingIndicator /> : null}

                  {turn.error ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs leading-5 text-red-200">
                      {turn.error}
                    </div>
                  ) : null}

                  {!turn.pending && !turn.error ? (
                    <>
                      <div className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                        {turn.answer}
                      </div>
                      <TracePanel turn={turn} />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 bg-black/10 p-3 sm:p-4">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-2 transition focus-within:border-amber-300/40">
          <textarea
            aria-label="Ask the Argus agent"
            className="max-h-36 min-h-[64px] w-full resize-none bg-transparent px-2 pt-1 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600"
            disabled={loading}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about products, currencies, or promotions…"
            rows={2}
            value={input}
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-1 pt-2">
            <span className="hidden text-[10px] text-slate-600 sm:block">
              Enter to send · Shift + Enter for a new line
            </span>
            <button
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-amber-300 px-3.5 py-2 text-xs font-semibold text-[#1a1204] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading || !input.trim()}
              onClick={() => void sendPrompt()}
              type="button"
            >
              {loading ? "Running…" : "Send"}
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-600">
          Replay answers the three recorded prompts. Use New chat between
          prompts; the agent URL stays server-side.
        </p>
      </div>
    </section>
  );
}
