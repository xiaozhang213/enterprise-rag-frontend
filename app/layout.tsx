import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise Knowledge Base Q&A",
  description: "Ask questions grounded in your own documents (RAG-powered).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
