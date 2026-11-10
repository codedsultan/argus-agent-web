# Argus Agent Web

The trace-first agent surface for the [Argus agent](https://github.com/codedsultan/argus-ai).

This app asks a tool-calling shop agent a question, renders the answer, and exposes the replayable trace behind it: the selected tool, the tool arguments, the tool result, the token estimate, and the trace identifier. It is the operator-facing companion to the customer storefront in [`argus-frontend`](https://github.com/codedsultan/argus-frontend).

Both frontends share the same replay backend. The customer storefront shows only customer-safe data; this app keeps the trace and tool detail visible.

**Live:** [argus-agent.xurl.fyi](https://argus-agent.xurl.fyi)

## Design notes

This app is deliberately small and boring in the right places:

- **Next.js App Router + TypeScript + Tailwind**
- **A server-side BFF** at `/api/prompt`, so the browser never sees `AGENT_URL`
- **A health proxy** at `/api/health` for the replay/live mode badge
- **No client-side API keys** and no direct browser-to-agent CORS

```text
Browser
  │  POST /api/prompt
  ▼
Next.js route handler ──► Argus public edge ──► Argus agent ──► shop API
  │                           │
  │                           └──► OTLP collector ──► Jaeger
  ▼
Chat transcript + trace inspector
```

## Run it locally

Start the replay backend from the sibling `argus-ai` checkout:

```bash
cd ../argus-ai
docker compose -f platform/compose.core.yaml up -d --build
```

The local stack exposes the agent at `http://localhost:8012`. If that port is
taken, set `AGENT_PORT` for Compose and `AGENT_URL` for this app to the same
value.

Then:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

The public demo is **replay-only**: the backend serves recorded LLM responses
and needs no provider key. It answers the three recorded prompts shown in the
empty state. Use **New chat** between prompts; the public edge rejects an
arbitrary prompt or a non-empty history.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_URL` | `http://localhost:8012` | Server-only agent base URL |
| `ARGUS_BFF_TOKEN` | empty | Optional bearer token shared with the public edge |
| `NEXT_PUBLIC_JAEGER_URL` | empty | Optional Jaeger UI base URL; leave blank when `/jaeger` is token-protected |

`AGENT_URL` and `ARGUS_BFF_TOKEN` are read only by route handlers. Do not prefix
them with `NEXT_PUBLIC_`.

The public edge can require a bearer token. When `PUBLIC_BFF_TOKEN` is set on
the backend, set the same value as `ARGUS_BFF_TOKEN` here. The BFF sends it on
server-side requests; the browser never sees it.

The public edge also protects `/jaeger` with the same token. Because the browser
cannot send that token, leave `NEXT_PUBLIC_JAEGER_URL` blank in the public
deployment. The trace panel still shows the trace identifier and the tool detail
returned by the agent.

## Deploy

Deploy this app to Vercel and point it at the public Argus edge:

```text
AGENT_URL=https://argus-api.xurl.fyi
ARGUS_BFF_TOKEN=<same value as PUBLIC_BFF_TOKEN>
NEXT_PUBLIC_JAEGER_URL=
```

The backend repository includes a single-container public profile in
`deploy/public/` plus `fly.toml` and `render.yaml`. Keep the backend in replay
mode.

## Scripts

```bash
pnpm dev        # local development
pnpm build      # production build
pnpm start      # serve the production build
pnpm typecheck  # tsc --noEmit
```

## License

MIT
