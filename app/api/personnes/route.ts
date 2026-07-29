import { NextResponse } from "next/server";
import {
  type Lang,
  construireFiche,
  normaliseLang,
  rechercher,
} from "@/app/lib/encyclopedie";

export const runtime = "nodejs";

/**
 * Fiches personnalités : recherche et informations sur des personnes publiques.
 * Sources : Wikipédia (biographie, photo) + Wikidata (faits structurés).
 * Aucune clé API n'est nécessaire.
 *
 * Toute la mécanique d'interrogation vit dans app/lib/encyclopedie.ts, partagée
 * avec la route /api/dossier.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const titre = searchParams.get("titre");
  const q = searchParams.get("q");
  const lang = normaliseLang(searchParams.get("lang"));

  try {
    if (titre) {
      let fiche = await construireFiche(titre, lang);

      // Article absent dans cette langue : on tente l'autre Wikipédia.
      if (!fiche) {
        const secours: Lang = lang === "fr" ? "en" : "fr";
        fiche = await construireFiche(titre, secours);
      }
      if (!fiche) {
        return NextResponse.json(
          { error: `Aucune page trouvée pour « ${titre} ».` },
          { status: 404 },
        );
      }
      return NextResponse.json({ fiche });
    }

    if (q && q.trim()) {
      return NextResponse.json({ resultats: await rechercher(q.trim(), lang) });
    }

    return NextResponse.json(
      { error: "Indiquez un nom à rechercher (paramètre q) ou une fiche (paramètre titre)." },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Impossible de contacter Wikipédia pour le moment." },
      { status: 502 },
    );
  }
}
