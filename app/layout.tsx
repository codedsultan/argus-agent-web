import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Argus Agent Web — a traceable shop agent",
  description:
    "Ask a tool-calling agent about a fictional field-supply shop, then inspect the replayable trace behind every answer. The customer storefront lives in argus-frontend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
