// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://grao.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Grão — Investimentos Imobiliários Inteligentes",
    template: "%s | Grão",
  },
  description:
    "A Grão é a plataforma de investimentos imobiliários para conquistar renda passiva com transparência, segurança e portfólios selecionados no Brasil.",
  keywords: [
    "investimentos imobiliários",
    "renda passiva",
    "imóveis fracionados",
    "fundos imobiliários",
    "crowdfunding imobiliário",
    "investir em imóveis",
    "plataforma de investimentos",
  ],
  authors: [{ name: "Grão" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Grão — Investimentos Imobiliários Inteligentes",
    description:
      "Invista em imóveis com transparência, taxas claras e seleção curada de oportunidades no Brasil.",
    siteName: "Grão",
    images: [
      {
        url: "/og/cover.jpg",
        width: 1200,
        height: 630,
        alt: "Grão — Investimentos Imobiliários",
      },
    ],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grão — Investimentos Imobiliários Inteligentes",
    description:
      "Plataforma para investir em imóveis com segurança, governança e oportunidades selecionadas.",
    images: ["/og/cover.jpg"],
    creator: "@grao",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  category: "finance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: "#0000", color: "#fff", border: "1px solid #0000" },
            className: "sonner-toast",
          }}
        />
      </body>
    </html>
  );
}
