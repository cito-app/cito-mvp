import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cito.mx - Tu Sitio de Citas",
  description: "Plataforma para controlar tus citas con página personalizada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}