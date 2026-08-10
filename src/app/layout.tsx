import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indobox | Business Dashboard",
  description: "Business performance dashboard powered by indobox-cms",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
