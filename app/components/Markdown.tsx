"use client";

/**
 * Rendu Markdown minimal : titres, listes, gras et paragraphes.
 *
 * Les synthèses produites par le modèle n'utilisent que ces quatre formes, et
 * une dépendance externe pour si peu serait disproportionnée. Chaque page passe
 * ses propres classes pour rester dans son habillage.
 */

export type ClassesMarkdown = {
  titre?: string;
  para?: string;
  liste?: string;
};

export default function Markdown({
  texte,
  classes = {},
}: {
  texte: string;
  classes?: ClassesMarkdown;
}) {
  const lignes = texte.split("\n");
  const blocs: React.ReactNode[] = [];
  let liste: string[] = [];

  const gras = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );

  const viderListe = () => {
    if (liste.length === 0) return;
    blocs.push(
      <ul key={`l${blocs.length}`} className={classes.liste}>
        {liste.map((item, i) => (
          <li key={i}>{gras(item)}</li>
        ))}
      </ul>,
    );
    liste = [];
  };

  for (const brute of lignes) {
    const ligne = brute.trim();

    if (!ligne) {
      viderListe();
    } else if (ligne.startsWith("#")) {
      viderListe();
      const titre = ligne.replace(/^#+\s*/, "");
      blocs.push(
        <h3 key={`h${blocs.length}`} className={classes.titre}>
          {titre}
        </h3>,
      );
    } else if (/^[-*]\s+/.test(ligne) || /^\d+\.\s+/.test(ligne)) {
      liste.push(ligne.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
    } else {
      viderListe();
      blocs.push(
        <p key={`p${blocs.length}`} className={classes.para}>
          {gras(ligne)}
        </p>,
      );
    }
  }
  viderListe();

  return <>{blocs}</>;
}
