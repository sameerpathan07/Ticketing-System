import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Ticketing System",
  description: "Full-stack support ticketing system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
