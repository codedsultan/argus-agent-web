import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_URL = (process.env.AGENT_URL ?? "http://localhost:8012").replace(
  /\/$/,
  "",
);
const BFF_TOKEN = process.env.ARGUS_BFF_TOKEN?.trim() ?? "";

type PromptBody = {
  message?: unknown;
  history?: unknown;
};

function authHeaders(): Record<string, string> {
  return BFF_TOKEN ? { authorization: `Bearer ${BFF_TOKEN}` } : {};
}

function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",", 1)[0].trim() || "agent-web";
  return request.headers.get("x-real-ip") ?? "agent-web";
}

export async function POST(request: Request) {
  let body: PromptBody;

  try {
    body = (await request.json()) as PromptBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json(
      { error: "A non-empty message is required." },
      { status: 400 },
    );
  }

  if (body.message.length > 4_000) {
    return NextResponse.json(
      { error: "Message is too long (max 4000 characters)." },
      { status: 413 },
    );
  }

  const history = Array.isArray(body.history) ? body.history : [];

  try {
    const upstream = await fetch(`${AGENT_URL}/prompt`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": clientAddress(request),
        ...authHeaders(),
      },
      body: JSON.stringify({ message: body.message, history }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });

    const payload = await upstream.json().catch(() => null);

    if (payload === null) {
      return NextResponse.json(
        { error: "The agent returned a non-JSON response." },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Argus agent." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
