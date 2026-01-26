import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laugh Lab",
  description: "AI-powered comedy script analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-white to-violet-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
