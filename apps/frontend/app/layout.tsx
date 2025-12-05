import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PlanIA - Plataforma de Planos de Ensino",
  description: "Plataforma para criação e gerenciamento de planos de ensino",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
