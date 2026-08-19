"use client";

import { useRef, useState } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import { ApiError, ingestDocumentsBatch, queryKnowledgeBaseStream } from "@/lib/api";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

 async function handleSend() {
  const question = input.trim();
  if (!question || isLoading) return;

  setMessages((prev) => [...prev, { role: "user", content: question }]);
  setInput("");
  setIsLoading(true);

  // 先插入一个空的assistant占位消息，之后靠流式增量填充它
  setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

  await queryKnowledgeBaseStream(question, {
    onDelta: (text) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, content: last.content + text };
        return updated;
      });
    },
    onSources: (sources) => {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, sources };
        return updated;
      });
    },
    onError: (message) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: message,
          isError: true,
        };
        return updated;
      });
    },
  });

  setIsLoading(false);
}

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const files = Array.from(e.target.files ?? []);
  if (files.length === 0) return;

  setIsUploading(true);
  setUploadStatus(null);
  try {
    const result = await ingestDocumentsBatch(files);
    const failedNames = result.results
      .filter((r) => r.status === "failed")
      .map((r) => r.filename);

    setUploadStatus(
      `成功 ${result.succeeded}/${result.total} 个文件` +
        (failedNames.length ? `，失败：${failedNames.join(", ")}` : "")
    );
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "上传失败";
    setUploadStatus(`上传失败：${message}`);
  } finally {
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
}

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col p-4">
      <header className="mb-4 flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">
            企业知识库问答
          </h1>
          <p className="text-xs text-gray-500">
            基于 RAG 的文档问答系统 — 回答均引用文档来源
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            {isUploading ? "上传中..." : "上传文档"}
          </button>
        </div>
      </header>

      {uploadStatus && (
        <p className="mb-3 text-xs text-gray-400">{uploadStatus}</p>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
            上传文档后，向知识库提问试试看
          </div>
        )}
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-800 px-4 py-3 text-sm text-gray-400">
              思考中...
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-gray-800 pt-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题，按 Enter 发送..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-600"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
