export type ToolCall = {
  id?: string;
  name?: string;
  args?: unknown;
  arguments?: unknown;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type AgentMessage = {
  role?: string;
  type?: string;
  content?: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  [key: string]: unknown;
};

export type Metrics = {
  messages?: number;
  llm_calls?: number;
  tool_calls?: number;
  estimated_tokens?: number;
};

export type PromptResponse = {
  response?: {
    messages?: AgentMessage[];
  };
  metrics?: Metrics;
  trace_id?: string | null;
  detail?: string;
  error?: string;
};

export type HealthResponse = {
  status?: string;
  mode?: string;
  tools?: string;
  history_max_tokens?: number;
};

export type Turn = {
  id: string;
  prompt: string;
  answer: string;
  messages: AgentMessage[];
  metrics: Metrics;
  traceId: string | null;
  error?: string;
  pending?: boolean;
};
