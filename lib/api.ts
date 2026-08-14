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
