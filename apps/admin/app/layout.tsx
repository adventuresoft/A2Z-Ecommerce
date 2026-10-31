import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "admin-lte/dist/css/adminlte.min.css";
import "./globals.css";
import { AdminLayoutProvider, AdminLayout } from "@/components/layout";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Dashboard — A to Z E-Commerce",
  description: "Back-office operations, catalog, and order management portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="layout-fixed sidebar-expand-lg bg-body-tertiary min-vh-100">
        <AuthProvider>
          <AdminLayoutProvider>
            <AdminLayout>{children}</AdminLayout>
          </AdminLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
