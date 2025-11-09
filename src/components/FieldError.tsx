import React from "react";

export default function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <div className="mt-1 text-xs text-red-600">
      {messages.map((m, i) => (
        <div key={i}>{m}</div>
      ))}
    </div>
  );
}
