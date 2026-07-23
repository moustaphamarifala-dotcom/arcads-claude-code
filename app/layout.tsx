import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio de Génération de Contenu IA",
  description:
    "Générez des textes, images et vidéos avec l'intelligence artificielle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
