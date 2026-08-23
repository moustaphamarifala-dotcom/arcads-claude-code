"use client";

import { Fragment, type ReactNode, useState } from "react";
import styles from "./dark.module.css";

/* --------------------------------------------------------------------------
 * Rendu Markdown minimal, sans dépendance externe.
 * Couvre ce qu'un modèle produit réellement en chat : blocs de code, titres,
 * listes, citations, règles horizontales, gras / italique / code inline / liens.
 * Le texte est toujours inséré via des nœuds React (jamais dangerouslySetInnerHTML),
 * donc rien de ce que renvoie le modèle ne peut être interprété comme du HTML.
 * ----------------------------------------------------------------------- */

/* --- Inline ------------------------------------------------------------- */

// Ordre important : le code inline est capturé avant le reste pour qu'un `**`
// à l'intérieur d'un backtick ne soit pas transformé en gras.
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))/g;

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;

  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const token = m[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith("`")) {
      out.push(
        <code key={key} className={styles.inlineCode}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);
      const safe = /^(https?:|mailto:)/i.test(href) ? href : undefined;
      out.push(
        safe ? (
          <a key={key} href={safe} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ) : (
          <Fragment key={key}>{label}</Fragment>
        ),
      );
    }
    last = start + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* --- Blocs de code ------------------------------------------------------ */

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* presse-papiers indisponible (http, permission refusée) : on ignore */
    }
  };

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBar}>
        <span>{lang || "code"}</span>
        <button type="button" onClick={copy}>
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* --- Blocs de texte ----------------------------------------------------- */

function renderTextBlock(source: string, keyPrefix: string): ReactNode[] {
  const lines = source.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Règle horizontale
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      out.push(<hr key={`${keyPrefix}-hr${k++}`} />);
      i++;
      continue;
    }

    // Titre
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const Tag = (["h3", "h4", "h5", "h6"] as const)[level - 1];
      out.push(
        <Tag key={`${keyPrefix}-h${k++}`}>{inline(heading[2], `${keyPrefix}-h${k}`)}</Tag>,
      );
      i++;
      continue;
    }

    // Citation
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(
        <blockquote key={`${keyPrefix}-q${k++}`}>
          {inline(buf.join(" "), `${keyPrefix}-q${k}`)}
        </blockquote>,
      );
      continue;
    }

    // Liste à puces
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      out.push(
        <ul key={`${keyPrefix}-ul${k++}`}>
          {items.map((it, n) => (
            <li key={n}>{inline(it, `${keyPrefix}-ul${k}-${n}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Liste numérotée
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      const start = parseInt(line.match(/^\s*(\d+)/)![1], 10);
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      out.push(
        <ol key={`${keyPrefix}-ol${k++}`} start={start}>
          {items.map((it, n) => (
            <li key={n}>{inline(it, `${keyPrefix}-ol${k}-${n}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraphe : on agrège jusqu'à la ligne vide ou le prochain bloc.
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^\s*([-*+]|\d+[.)]|>|#{1,4}\s)/.test(lines[i]) &&
      !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(
      <p key={`${keyPrefix}-p${k++}`}>{inline(buf.join("\n"), `${keyPrefix}-p${k}`)}</p>,
    );
  }

  return out;
}

/* --- Composant public --------------------------------------------------- */

export default function Markdown({ text }: { text: string }) {
  // Découpage sur les clôtures ```. Un nombre impair de segments signifie
  // qu'un bloc est encore ouvert (streaming en cours) : on le rend quand même.
  const parts = text.split(/```/);
  const nodes: ReactNode[] = [];

  parts.forEach((part, idx) => {
    if (idx % 2 === 0) {
      nodes.push(...renderTextBlock(part, `b${idx}`));
      return;
    }
    const nl = part.indexOf("\n");
    const lang = nl === -1 ? part.trim() : part.slice(0, nl).trim();
    const code = nl === -1 ? "" : part.slice(nl + 1).replace(/\n$/, "");
    nodes.push(<CodeBlock key={`c${idx}`} lang={lang} code={code} />);
  });

  return <div className={styles.md}>{nodes}</div>;
}
