import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AGENT_URL = (process.env.AGENT_URL ?? "http://localhost:8012").replace(
  /\/$/,
  "",
);
const BFF_TOKEN = process.env.ARGUS_BFF_TOKEN?.trim() ?? "";

function authHeaders(): Record<string, string> {
  return BFF_TOKEN ? { authorization: `Bearer ${BFF_TOKEN}` } : {};
}

export async function GET() {
  try {
    const upstream = await fetch(`${AGENT_URL}/healthz`, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...authHeaders(),
      },
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await upstream.json().catch(() => null);

    if (payload === null) {
      return NextResponse.json(
        { status: "unavailable", mode: "unknown" },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }

    return NextResponse.json(payload, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { status: "unavailable", mode: "unknown" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
