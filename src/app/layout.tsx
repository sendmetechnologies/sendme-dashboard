import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SendMe Admin Dashboard",
  description: "SendMe platform administration panel",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-surface-secondary text-text-primary">
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
