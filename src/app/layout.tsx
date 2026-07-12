import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SendMe Admin Dashboard",
  description: "SendMe platform administration panel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-surface-secondary text-text-primary">{children}</body>
    </html>
  );
}
