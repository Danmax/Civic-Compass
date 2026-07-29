import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Civic Compass — Understand your political values",
  description:
    "A private, nonpartisan assessment that maps how your values and policy views fit together.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
