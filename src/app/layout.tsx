import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
