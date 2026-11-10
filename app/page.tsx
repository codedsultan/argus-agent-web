import { ArgusMark } from "@/components/ArgusMark";
import { ArgusChat } from "@/components/ArgusChat";

const loop = [
  {
    label: "Prompt",
    detail: "The browser sends one message and the conversation history.",
  },
  {
    label: "Agent",
    detail: "A LangChain agent chooses a tool and records a GenAI span.",
  },
  {
    label: "Tool",
    detail: "The tool calls the local shop API over HTTP.",
  },
  {
    label: "Trace",
    detail: "Jaeger shows the LLM call, tool span, and token counts.",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-fade" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <ArgusMark className="h-10 w-10 text-amber-300" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-[0.28em] text-slate-100">
              ARGUS
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              agent observability lab
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-xs text-slate-400">
          <a
            className="transition hover:text-amber-200"
            href="https://github.com/codedsultan/argus-ai"
            rel="noreferrer"
            target="_blank"
          >
            Backend ↗
          </a>
          <a
            className="transition hover:text-amber-200"
            href="https://github.com/codedsultan/argus-frontend"
            rel="noreferrer"
            target="_blank"
          >
            Customer frontend ↗
          </a>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12 lg:pt-10">
        <div className="lg:sticky lg:top-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            trace-first agent demo
          </div>

          <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-slate-50 sm:text-5xl">
            Ask a shop agent.
            <span className="block text-amber-300">See every step.</span>
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
            Argus runs a tool-calling agent against a deterministic replay of a
            fictional field-supply shop. The answer is reproducible. The
            OpenTelemetry trace is real.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              The loop
            </p>
            <ol className="mt-4 space-y-4">
              {loop.map((step, index) => (
                <li className="flex gap-3" key={step.label}>
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/[0.07] font-mono text-[10px] text-amber-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-teal-300">
                replay default
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                No provider key is needed for the public demo.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                server-side BFF
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                The agent URL never reaches the browser.
              </p>
            </div>
          </div>
        </div>

        <ArgusChat />
      </section>

      <footer className="relative mx-auto flex max-w-7xl flex-col gap-2 border-t border-white/[0.06] px-5 py-6 text-[11px] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Argus is a trace-first portfolio lab for tool-calling agents.
        </p>
        <p className="font-mono uppercase tracking-wider">
          replay · tool calls · genai spans · jaeger
        </p>
      </footer>
    </main>
  );
}
