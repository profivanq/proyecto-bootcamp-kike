import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Planificador de Sábados · iAcademy",
  description: "Asignación y cobertura de turnos de los sábados para el equipo de iAcademy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={publicSans.variable}>
      <body>{children}</body>
    </html>
  );
}
