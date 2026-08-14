import type { SourceChunk } from "@/lib/api";

export default function SourceList({ sources }: { sources: SourceChunk[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-400">参考来源</p>
      {sources.map((source, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 text-xs text-gray-300"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-medium text-gray-200">{source.source}</span>
            <span className="text-gray-500">
              相似度 {(source.score * 100).toFixed(0)}%
            </span>
          </div>
          <p className="line-clamp-3 text-gray-400">{source.content}</p>
        </div>
      ))}
    </div>
  );
}
