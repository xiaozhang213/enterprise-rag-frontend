/**
 * 后端API调用封装。
 * 集中在这一个文件的好处：以后接口地址/鉴权方式变化，
 * 只改这里，组件完全不用动。
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface SourceChunk {
  content: string;
  source: string;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface IngestResponse {
  filename: string;
  chunks_created: number;
  status: string;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function queryKnowledgeBase(
  question: string
): Promise<QueryResponse> {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ApiError(detail || "查询失败，请稍后重试", res.status);
  }

  return res.json();
}

export async function ingestDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/ingest`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ApiError(detail || "文档上传失败", res.status);
  }

  return res.json();
}

interface StreamHandlers {
  onDelta: (text: string) => void;
  onSources: (sources: SourceChunk[]) => void;
  onError: (message: string) => void;
}

export async function queryKnowledgeBaseStream(
  question: string,
  handlers: StreamHandlers
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    handlers.onError(detail || "请求失败，请检查后端服务是否启动");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE协议里每个事件以两个换行分隔，一次读取可能包含多个完整事件
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      parseSseEvent(rawEvent, handlers);
    }
  }
}

function parseSseEvent(rawEvent: string, handlers: StreamHandlers) {
  let event = "message";
  let data = "";

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data = line.slice(5).trim();
  }
  if (!data) return;

  try {
    const parsed = JSON.parse(data);
    if (event === "message") handlers.onDelta(parsed.delta);
    if (event === "sources") handlers.onSources(parsed.sources);
    if (event === "error") handlers.onError(parsed.message);
  } catch {
    handlers.onError("解析响应数据失败");
  }
}

export interface BatchIngestResult {
  filename: string;
  status: "success" | "failed";
  chunks_created: number;
  error: string | null;
}

export interface BatchIngestResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchIngestResult[];
}

export async function ingestDocumentsBatch(
  files: File[]
): Promise<BatchIngestResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const res = await fetch(`${API_BASE_URL}/ingest/batch`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new ApiError(detail || "批量上传失败", res.status);
  }

  return res.json();
}