import type { SourceChunk } from "@/lib/api";
import SourceList from "./SourceList";

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  isError?: boolean;
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white"
            : message.isError
            ? "bg-red-950/60 border border-red-800 text-red-200"
            : "bg-gray-800 text-gray-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.sources && (
          <SourceList sources={message.sources} />
        )}
      </div>
    </div>
  );
}
