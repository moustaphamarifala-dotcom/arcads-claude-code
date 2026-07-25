"use client";

import { useMemo, useState } from "react";
import {
  INDICATIFS,
  lienWhatsapp,
  MAX_BIO,
  MODELES_BIO,
  validerBio,
  validerNom,
  type Verdict,
} from "../lib/profilCompte";
import type { Profil } from "../lib/profil";
import styles from "../tiktok.module.css";

function Verdicts({ liste }: { liste: Verdict[] }) {
  return (
    <ul className={styles.liste} style={{ marginTop: 10 }}>
      {liste.map((v, i) => (
        <li key={i} className={v.ok ? styles.ok : styles.corriger}>
          {v.message}
        </li>
      ))}
    </ul>
  );
}

export default function FicheProfil({ profil }: { profil: Profil }) {
  const [nom, setNom] = useState("");
  const [bio, setBio] = useState("");
  const [indicatif, setIndicatif] = useState("226");
  const [numero, setNumero] = useState("");
  const [messagePre, setMessagePre] = useState(
    "Bonjour, je viens de TikTok. Je voudrais les prix du bazin.",
  );
  const [copie, setCopie] = useState("");

  const motCle = profil.produit.trim().split(/\s+/)[0] || "bazin";
  const verdictsNom = useMemo(() => validerNom(nom, motCle), [nom, motCle]);
  const verdictsBio = useMemo(() => validerBio(bio), [bio]);
  const lien = useMemo(
    () => lienWhatsapp(indicatif, numero, messagePre),
    [indicatif, numero, messagePre],
  );

  async function copier(texte: string, cle: string) {
    await navigator.clipboard.writeText(texte);
    setCopie(cle);
    setTimeout(() => setCopie(""), 1500);
  }

  return (
    <div>
      <div className={styles.carte}>
        <div className={styles.carteTitre}>Ta page de vente</div>
        <p className={styles.carteSous}>
          Quand une vidéo marche, le spectateur fait un seul geste : il ouvre ton profil.
          Si cette page ne dit pas en trois secondes ce que tu vends, où tu es et comment
          commander, la vue est perdue — et elle t&apos;a coûté aussi cher à produire
          qu&apos;une vue qui rapporte. C&apos;est la correction la plus rentable de
          toutes, et elle prend cinq minutes.
        </p>
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>1. Nom affiché</div>
        <p className={styles.carteSous}>
          Ce n&apos;est pas ton pseudo, c&apos;est le texte en gras au-dessus. Il est
          indexé par la recherche TikTok, il accepte les espaces et les majuscules, et tu
          peux le changer quand tu veux. Mets ton mot-clé au début : l&apos;en-tête du
          profil coupe au-delà de 20 caractères.
        </p>
        <div className={styles.champ}>
          <label htmlFor="fp-nom">Nom affiché</label>
          <input
            id="fp-nom"
            type="text"
            maxLength={40}
            value={nom}
            placeholder="Bazin Mari Falah"
            onChange={(e) => setNom(e.target.value)}
          />
        </div>
        <Verdicts liste={verdictsNom} />
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>2. Bio</div>
        <p className={styles.carteSous}>
          80 caractères, pas un de plus. Trois informations, dans cet ordre : ce que tu
          vends, où tu es, comment commander.
        </p>

        <div className={styles.champ}>
          <label htmlFor="fp-bio">
            Bio — {bio.trim().length}/{MAX_BIO} caractères
          </label>
          <textarea
            id="fp-bio"
            rows={3}
            value={bio}
            placeholder={`Bazin riche en gros · ${profil.ville}\nRevendeuses bienvenues\nCommande WhatsApp 👇`}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <Verdicts liste={verdictsBio} />

        <div style={{ marginTop: 20 }}>
          <div className={styles.carteTitre} style={{ fontSize: "0.95rem" }}>
            Modèles prêts à l&apos;emploi
          </div>
          {MODELES_BIO.map((m) => {
            const texte = m.texte.replace(/\{ville\}/g, profil.ville || "ta ville");
            return (
              <div key={m.cible} className={styles.hook}>
                <div className={styles.tagTaille}>{m.cible}</div>
                <div className={styles.hookTexte} style={{ whiteSpace: "pre-line" }}>
                  {texte}
                </div>
                <div className={styles.hookPourquoi}>{m.pourquoi}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={styles.copier} onClick={() => setBio(texte)}>
                    Utiliser
                  </button>
                  <button
                    className={styles.copier}
                    onClick={() => copier(texte, m.cible)}
                  >
                    {copie === m.cible ? "Copié" : "Copier"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.carte}>
        <div className={styles.carteTitre}>3. Lien WhatsApp</div>
        <p className={styles.carteSous}>
          C&apos;est ici que ton numéro a le droit d&apos;exister. Affiché dans une vidéo,
          il te coûte de la distribution ; placé dans le champ « lien » de ton profil, il
          devient cliquable et ne te coûte rien. Même information, effet inverse. Le champ
          lien s&apos;ouvre à partir de 1 000 abonnés.
        </p>

        <div className={styles.grille2}>
          <div className={styles.champ}>
            <label htmlFor="fp-ind">Pays</label>
            <select
              id="fp-ind"
              value={indicatif}
              onChange={(e) => setIndicatif(e.target.value)}
            >
              {INDICATIFS.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.pays} (+{i.code})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.champ}>
            <label htmlFor="fp-num">Ton numéro WhatsApp</label>
            <input
              id="fp-num"
              type="tel"
              value={numero}
              placeholder="55 13 34 14"
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.champ} style={{ marginTop: 14 }}>
          <label htmlFor="fp-msg">Message pré-rempli à l&apos;ouverture</label>
          <input
            id="fp-msg"
            type="text"
            value={messagePre}
            onChange={(e) => setMessagePre(e.target.value)}
          />
          <div className={styles.etapeDetail}>
            Le message s&apos;écrit tout seul dans la conversation. La personne n&apos;a
            plus qu&apos;à appuyer sur envoyer — et tu sais d&apos;où elle vient.
          </div>
        </div>

        {numero.trim() && (
          <>
            <div className={styles.tagChaine} style={{ marginTop: 18, fontSize: "0.95rem" }}>
              {lien.url}
            </div>
            {lien.valide ? (
              <div className={styles.barreActions} style={{ marginTop: 0 }}>
                <button className="btn" onClick={() => copier(lien.url, "lien")}>
                  {copie === "lien" ? "Lien copié" : "Copier le lien"}
                </button>
                <a
                  className="btn btn-secondary"
                  href={lien.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  Tester
                </a>
              </div>
            ) : (
              <div className="error-box">
                Ce numéro ne semble pas complet. Saisis-le sans l&apos;indicatif pays et
                sans le zéro initial.
              </div>
            )}
          </>
        )}

        <div className={styles.note}>
          Où le coller : ton profil → Modifier le profil → Site web. Puis retire le numéro
          de toutes tes prochaines vignettes.
        </div>
      </div>
    </div>
  );
}
