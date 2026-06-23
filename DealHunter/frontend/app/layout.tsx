import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "DealHunter Imobiliário",
  description: "Caçador de imóveis alavancados — o aluguel paga a parcela.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 py-8 text-xs text-slate-400">
          Estimativas, não recomendação de investimento. IR é aproximação isolada por imóvel.
          Valorização passada ≠ futura.
        </footer>
      </body>
    </html>
  );
}
