"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./tiktok.module.css";
import { FAMILLES, remplir } from "./accroches";
import { PICS, joursAvant, phasePour } from "./calendrier";
import { diagnostiquer } from "./diagnostic";

type Mode =
  | "produit"
  | "idees"
  | "score"
  | "vues"
  | "plan"
  | "calendrier"
  | "accroches";

type Profil = {
  produit: string;
  zone: string;
  prix: string;
  commande: string;
};

type Critere = { nom: string; note: number; commentaire: string };
type Analyse = {
  note: number;
  verdict: string;
  criteres: Critere[];
  corrections: string[];
  hooks: string[];
};

const PROFIL_VIDE: Profil = { produit: "", zone: "", prix: "", commande: "" };
const CLE_PROFIL = "studio-tiktok-profil";

const CHAMPS_PROFIL: {
  cle: keyof Profil;
  label: string;
  aide: string;
  exemple: string;
}[] = [
  {
    cle: "produit",
    label: "Ce que tu vends",
    aide: "Sois précis : la qualité et la provenance changent complètement les arguments.",
    exemple: "bazin riche Getzner, et du bazin teint à la main",
  },
  {
    cle: "zone",
    label: "Où tu livres",
    aide: "C'est ce qui décide si une vue vaut quelque chose ou rien du tout.",
    exemple: "Bamako en main propre, tout le Mali, et envoi vers la France",
  },
  {
    cle: "prix",
    label: "Tes prix",
    aide: "Donne au moins un repère. Sans prix, tes vidéos resteront vagues.",
    exemple: "complet de 6 yards à partir de 25 000 F CFA",
  },
  {
    cle: "commande",
    label: "Comment on commande chez toi",
    aide: "La phrase qui finira chacune de tes vidéos.",
    exemple: "WhatsApp au 00 000 00 00, ou en message privé ici",
  },
];

const MODES: { id: Mode; label: string; resume: string }[] = [
  {
    id: "produit",
    label: "🎬 Vidéo produit",
    resume:
      "Une pièce, une vidéo complète : accroche, plan par plan, prix, appel à commander.",
  },
  {
    id: "idees",
    label: "💡 Idées de vidéos",
    resume: "5 concepts variés pour ta boutique, pas cinq fois la même vidéo.",
  },
  {
    id: "score",
    label: "🎯 Score de la vidéo",
    resume: "Colle ton script : est-ce qu'il fait commander, ou juste regarder ?",
  },
  {
    id: "vues",
    label: "📊 Pourquoi je n'ai pas de vues",
    resume:
      "Entre tes chiffres TikTok : le diagnostic dit si ça casse à l'accroche ou au milieu. Sans IA, immédiat.",
  },
  {
    id: "plan",
    label: "📅 Plan 7 jours",
    resume: "Une semaine de publication qui alterne se faire connaître et vendre.",
  },
  {
    id: "calendrier",
    label: "🗓️ Calendrier des ventes",
    resume: "Quand publier avant chaque fête. Sans IA, immédiat.",
  },
  {
    id: "accroches",
    label: "🪝 Accroches",
    resume: "45 accroches de vendeur à remplir avec ton produit. Sans IA, immédiat.",
  },
];

const OBJECTIFS: { id: string; label: string }[] = [
  { id: "commandes", label: "Des commandes maintenant" },
  { id: "connaitre", label: "Me faire connaître" },
  { id: "confiance", label: "Rassurer ceux qui hésitent" },
  { id: "fidele", label: "Faire revenir mes clients" },
];

const ACTIONS: Record<string, string> = {
  produit: "→ Écrire la vidéo",
  idees: "→ Trouver 5 idées",
  score: "→ Analyser mon script",
  plan: "→ Construire ma semaine",
};

/** Rendu Markdown minimal : titres, listes, gras et paragraphes. */
function Markdown({ texte }: { texte: string }) {
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
      <ul key={`l${blocs.length}`} className={styles.mdListe}>
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
      blocs.push(
        <h3 key={`h${blocs.length}`} className={styles.mdTitre}>
          {ligne.replace(/^#+\s*/, "")}
        </h3>,
      );
    } else if (/^[-*]\s+/.test(ligne) || /^\d+\.\s+/.test(ligne)) {
      liste.push(ligne.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
    } else {
      viderListe();
      blocs.push(
        <p key={`p${blocs.length}`} className={styles.mdPara}>
          {gras(ligne)}
        </p>,
      );
    }
  }
  viderListe();

  return <>{blocs}</>;
}

/** Bouton de copie qui confirme lui-même, sans alerte ni notification. */
function Copier({ texte, libelle = "Copier" }: { texte: string; libelle?: string }) {
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    if (!copie) return;
    const t = setTimeout(() => setCopie(false), 1600);
    return () => clearTimeout(t);
  }, [copie]);

  return (
    <button
      className={styles.copier}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setCopie(true);
        } catch {
          setCopie(false);
        }
      }}
    >
      {copie ? "✓ Copié" : libelle}
    </button>
  );
}

function Jauge({ note }: { note: number }) {
  const niveau = note >= 75 ? "haut" : note >= 50 ? "moyen" : "bas";
  const verdict =
    note >= 75
      ? "Prête à tourner"
      : note >= 50
        ? "Bonne base, l'accroche à retravailler"
        : "À réécrire avant de tourner";

  return (
    <div className={`${styles.jauge} ${styles[`jauge_${niveau}`]}`}>
      <div className={styles.jaugeNote}>
        <strong>{note}</strong>
        <span>/100</span>
      </div>
      <div className={styles.jaugeBarre}>
        <div className={styles.jaugeRemplie} style={{ width: `${note}%` }} />
      </div>
      <p className={styles.jaugeVerdict}>{verdict}</p>
    </div>
  );
}

export default function StudioTikTok() {
  const [mode, setMode] = useState<Mode>("produit");

  const [profil, setProfil] = useState<Profil>(PROFIL_VIDE);
  const [profilOuvert, setProfilOuvert] = useState(true);
  const [profilCharge, setProfilCharge] = useState(false);

  const [sujet, setSujet] = useState("");
  const [objectif, setObjectif] = useState("commandes");
  const [format, setFormat] = useState("au téléphone, à la boutique, en lumière du jour");
  const [texte, setTexte] = useState("");
  const [dateFete, setDateFete] = useState("");
  const [mesures, setMesures] = useState({
    dureeVideo: "",
    dureeMoyenne: "",
    vues: "",
    abonnes: "",
    messages: "",
  });

  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<Analyse | null>(null);
  const [moteur, setMoteur] = useState<string | null>(null);

  const [famille, setFamille] = useState(FAMILLES[0].id);
  const familleActive = useMemo(
    () => FAMILLES.find((f) => f.id === famille) ?? FAMILLES[0],
    [famille],
  );

  // Le profil reste dans le navigateur : rien n'est envoyé ailleurs qu'aux
  // générations que l'utilisateur déclenche lui-même.
  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_PROFIL);
      if (brut) {
        const lu = JSON.parse(brut) as Partial<Profil>;
        const complet = { ...PROFIL_VIDE, ...lu };
        setProfil(complet);
        setProfilOuvert(!complet.produit.trim());
      }
    } catch {
      // Profil illisible ou stockage refusé : on repart d'un profil vide.
    }
    setProfilCharge(true);
  }, []);

  useEffect(() => {
    if (!profilCharge) return;
    try {
      localStorage.setItem(CLE_PROFIL, JSON.stringify(profil));
    } catch {
      // Stockage indisponible : le profil vaut pour la session en cours.
    }
  }, [profil, profilCharge]);

  const profilIncomplet = !profil.produit.trim() || !profil.zone.trim();
  const utiliseIA = mode === "produit" || mode === "idees" || mode === "score" || mode === "plan";

  const nombre = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const diagnostic = useMemo(
    () =>
      diagnostiquer({
        dureeVideo: nombre(mesures.dureeVideo),
        dureeMoyenne: nombre(mesures.dureeMoyenne),
        vues: nombre(mesures.vues),
        abonnes: nombre(mesures.abonnes),
        messages: nombre(mesures.messages),
      }),
    [mesures],
  );

  function changerMode(cible: Mode) {
    setMode(cible);
    setErreur(null);
    setResultat(null);
    setAnalyse(null);
  }

  async function generer() {
    if (charge) return;

    if ((mode === "produit" || mode === "score") && !texte.trim()) {
      setErreur(
        mode === "produit"
          ? "Décris la pièce que tu veux vendre : couleur, qualité, quantité."
          : "Colle d'abord le script ou l'accroche à analyser.",
      );
      return;
    }
    if ((mode === "idees" || mode === "plan") && !sujet.trim()) {
      setErreur("Indique l'angle ou le sujet du moment.");
      return;
    }

    setCharge(true);
    setErreur(null);
    setResultat(null);
    setAnalyse(null);

    try {
      const res = await fetch("/api/tiktok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, niche: sujet, objectif, format, texte, ...profil }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Erreur serveur (${res.status})`);

      setResultat(data.resultat ?? null);
      setAnalyse(data.analyse ?? null);
      setMoteur(data.moteur);
    } catch (err) {
      setErreur((err as Error).message);
    } finally {
      setCharge(false);
    }
  }

  const jours = dateFete ? joursAvant(dateFete) : null;
  const phase = jours === null ? null : phasePour(jours);

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <span className={styles.badge}>🎬 Studio TikTok — vendeur</span>
          <h1>
            Des vidéos qui <span>font commander</span>
          </h1>
          <p>
            Personne ne peut te garantir une vidéo virale, et cette application ne le
            prétend pas. Elle vise autre chose, plus utile pour toi : la vue ne te
            rapporte rien, la commande si. Cent mille vues venues d&apos;un pays où tu ne
            livres pas ne valent rien ; deux mille vues chez les bonnes personnes
            remplissent ta semaine. Tout ici est réglé sur cette idée.
          </p>
        </header>

        {/* ---------------- Profil vendeur ---------------- */}

        <section className={`${styles.profil} ${profilOuvert ? "" : styles.profilFerme}`}>
          <button
            className={styles.profilTete}
            onClick={() => setProfilOuvert((v) => !v)}
            aria-expanded={profilOuvert}
          >
            <span>
              <strong>Ta boutique</strong>
              <em>
                {profilIncomplet
                  ? "à compléter — sans ça, les vidéos resteront vagues"
                  : profil.produit}
              </em>
            </span>
            <span className={styles.profilFleche}>{profilOuvert ? "▲" : "▼"}</span>
          </button>

          {profilOuvert && (
            <div className={styles.profilCorps}>
              <p className={styles.profilIntro}>
                Ces quatre réponses sont reprises dans chaque vidéo que l&apos;application
                écrit pour toi. Elles restent dans ton navigateur, tu ne les retapes
                qu&apos;une fois.
              </p>
              {CHAMPS_PROFIL.map((champ) => (
                <div key={champ.cle} className={styles.profilChamp}>
                  <label className={styles.champLabel} htmlFor={`profil-${champ.cle}`}>
                    {champ.label}
                  </label>
                  <input
                    id={`profil-${champ.cle}`}
                    className={styles.champ}
                    value={profil[champ.cle]}
                    onChange={(e) =>
                      setProfil((p) => ({ ...p, [champ.cle]: e.target.value }))
                    }
                    placeholder={champ.exemple}
                  />
                  <p className={styles.profilAide}>{champ.aide}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <nav className={styles.modes} aria-label="Outil">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.mode} ${mode === m.id ? styles.modeActif : ""}`}
              onClick={() => changerMode(m.id)}
            >
              <strong>{m.label}</strong>
              <span>{m.resume}</span>
            </button>
          ))}
        </nav>

        {/* ---------------- Diagnostic des vues ---------------- */}

        {mode === "vues" && (
          <section className={styles.bloc}>
            <h2 className={styles.blocTitre}>Pourquoi cette vidéo n&apos;a pas marché</h2>
            <p className={styles.blocIntro}>
              Le compteur de vues ne dit jamais <em>pourquoi</em>. Le chiffre qui le dit,
              c&apos;est la rétention : la part de ta vidéo réellement regardée. Très
              basse, le problème est ton accroche. Moyenne, c&apos;est le milieu qui
              décroche. Ouvre une de tes vidéos dans TikTok, va dans ses statistiques, et
              recopie les chiffres ici.
            </p>

            <div className={styles.mesures}>
              <div>
                <label className={styles.champLabel} htmlFor="duree-video">
                  Durée de la vidéo (secondes)
                </label>
                <input
                  id="duree-video"
                  className={styles.champ}
                  inputMode="decimal"
                  value={mesures.dureeVideo}
                  onChange={(e) =>
                    setMesures((m) => ({ ...m, dureeVideo: e.target.value }))
                  }
                  placeholder="28"
                />
              </div>
              <div>
                <label className={styles.champLabel} htmlFor="duree-moyenne">
                  Durée moyenne de visionnage (secondes)
                </label>
                <input
                  id="duree-moyenne"
                  className={styles.champ}
                  inputMode="decimal"
                  value={mesures.dureeMoyenne}
                  onChange={(e) =>
                    setMesures((m) => ({ ...m, dureeMoyenne: e.target.value }))
                  }
                  placeholder="7"
                />
              </div>
              <div>
                <label className={styles.champLabel} htmlFor="nb-vues">
                  Vues
                </label>
                <input
                  id="nb-vues"
                  className={styles.champ}
                  inputMode="numeric"
                  value={mesures.vues}
                  onChange={(e) => setMesures((m) => ({ ...m, vues: e.target.value }))}
                  placeholder="240"
                />
              </div>
              <div>
                <label className={styles.champLabel} htmlFor="nb-abonnes">
                  Abonnés gagnés
                </label>
                <input
                  id="nb-abonnes"
                  className={styles.champ}
                  inputMode="numeric"
                  value={mesures.abonnes}
                  onChange={(e) => setMesures((m) => ({ ...m, abonnes: e.target.value }))}
                  placeholder="3"
                />
              </div>
              <div>
                <label className={styles.champLabel} htmlFor="nb-messages">
                  Messages reçus après la vidéo
                </label>
                <input
                  id="nb-messages"
                  className={styles.champ}
                  inputMode="numeric"
                  value={mesures.messages}
                  onChange={(e) =>
                    setMesures((m) => ({ ...m, messages: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <p className={styles.profilAide}>
              Les deux premiers chiffres suffisent pour lancer le diagnostic. Les autres
              l&apos;affinent — surtout le dernier, qui est le seul qui te paye.
            </p>

            {diagnostic.retention !== null && (
              <>
                <div
                  className={`${styles.jauge} ${
                    diagnostic.retention >= 65
                      ? styles.jauge_haut
                      : diagnostic.retention >= 35
                        ? styles.jauge_moyen
                        : styles.jauge_bas
                  }`}
                >
                  <div className={styles.jaugeNote}>
                    <strong>{Math.round(diagnostic.retention)}</strong>
                    <span>% regardés</span>
                  </div>
                  <div className={styles.jaugeBarre}>
                    <div
                      className={styles.jaugeRemplie}
                      style={{ width: `${Math.min(diagnostic.retention, 100)}%` }}
                    />
                  </div>
                  <p className={styles.jaugeVerdict}>
                    {diagnostic.retention >= 65
                      ? "Les gens restent jusqu'au bout"
                      : diagnostic.retention >= 35
                        ? "Ils partent en cours de route"
                        : "Ils partent presque tout de suite"}
                  </p>
                </div>

                <ul className={styles.constats}>
                  {diagnostic.constats.map((c, i) => (
                    <li key={i} className={styles[`constat_${c.niveau}`]}>
                      <strong>{c.titre}</strong>
                      <p>{c.texte}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className={styles.note}>
              Ces seuils sont des repères tirés de l&apos;usage, pas des chiffres
              officiels : TikTok ne publie pas le fonctionnement de son algorithme. Ils
              servent à savoir quoi retravailler en premier, pas à prédire le résultat
              d&apos;une vidéo.
            </p>
          </section>
        )}

        {/* ---------------- Calendrier des ventes ---------------- */}

        {mode === "calendrier" && (
          <section className={styles.bloc}>
            <h2 className={styles.blocTitre}>Quand publier avant une fête</h2>
            <p className={styles.blocIntro}>
              L&apos;erreur qui coûte le plus cher est de pousser la vente la semaine de
              la fête. À ce moment-là, ton client ne trouve plus de tailleur disponible,
              donc il n&apos;achète plus de tissu à coudre. Ton pic de commandes tombe
              plusieurs semaines avant. Entre la date de ta prochaine échéance et
              l&apos;application te dit où tu en es.
            </p>

            <label className={styles.champLabel} htmlFor="date-fete">
              Date de ta prochaine grosse échéance
            </label>
            <input
              id="date-fete"
              type="date"
              className={styles.champ}
              value={dateFete}
              onChange={(e) => setDateFete(e.target.value)}
            />
            <p className={styles.profilAide}>
              Les dates des fêtes musulmanes suivent la lune : elles avancent
              d&apos;environ onze jours chaque année et varient d&apos;un pays à
              l&apos;autre. C&apos;est pour ça que l&apos;application ne les devine pas —
              vérifie la tienne et saisis-la ici.
            </p>

            {phase && jours !== null && (
              <div className={`${styles.phase} ${styles[`phase_${phase.ton}`]}`}>
                <div className={styles.phaseHaut}>
                  <strong>{phase.titre}</strong>
                  <span>
                    {jours < 0
                      ? `il y a ${Math.abs(jours)} jour${Math.abs(jours) > 1 ? "s" : ""}`
                      : jours === 0
                        ? "c'est aujourd'hui"
                        : `dans ${jours} jour${jours > 1 ? "s" : ""}`}
                  </span>
                </div>
                <p>{phase.conseil}</p>
              </div>
            )}

            <h3 className={styles.sousTitre}>Tes saisons de vente</h3>
            <div className={styles.pics}>
              {PICS.map((pic) => (
                <article key={pic.id} className={styles.pic}>
                  <h4>{pic.nom}</h4>
                  <p className={styles.picQuand}>{pic.quand}</p>
                  <p>{pic.pourquoi}</p>
                  <ul>
                    {pic.aFilmer.map((idee, i) => (
                      <li key={i}>{idee}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Bibliothèque d'accroches ---------------- */}

        {mode === "accroches" && (
          <section className={styles.bloc}>
            <label className={styles.champLabel} htmlFor="sujet-accroche">
              Ton produit — il remplace le trou dans chaque accroche
            </label>
            <input
              id="sujet-accroche"
              className={styles.champ}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder={profil.produit || "le bazin riche, le wax, la dentelle…"}
            />

            <div className={styles.puces}>
              {FAMILLES.map((f) => (
                <button
                  key={f.id}
                  className={`${styles.puce} ${famille === f.id ? styles.puceActive : ""}`}
                  onClick={() => setFamille(f.id)}
                >
                  {f.titre}
                </button>
              ))}
            </div>

            <p className={styles.pourquoi}>{familleActive.pourquoi}</p>

            <ul className={styles.accroches}>
              {familleActive.modeles.map((modele) => {
                const phrase = remplir(modele, sujet || profil.produit);
                return (
                  <li key={modele}>
                    <span>{phrase}</span>
                    <Copier texte={phrase} />
                  </li>
                );
              })}
            </ul>

            <p className={styles.note}>
              Une bonne accroche sur une vidéo vide fait juste partir les gens un peu plus
              tard. Choisis celle qui correspond à ce que tu as vraiment à montrer — et
              ne promets jamais dans l&apos;accroche ce que la marchandise ne tient pas.
            </p>
          </section>
        )}

        {/* ---------------- Formulaires IA ---------------- */}

        {utiliseIA && (
          <section className={styles.bloc}>
            {profilIncomplet && (
              <p className={styles.avertissement}>
                Ta boutique n&apos;est pas encore renseignée. L&apos;application va écrire
                des vidéos passe-partout, avec des trous entre crochets à compléter à la
                main.{" "}
                <button
                  className={styles.lienBouton}
                  onClick={() => setProfilOuvert(true)}
                >
                  Compléter maintenant
                </button>
              </p>
            )}

            {mode === "produit" && (
              <>
                <label className={styles.champLabel} htmlFor="piece">
                  La pièce que tu veux vendre aujourd&apos;hui
                </label>
                <textarea
                  id="piece"
                  className={styles.zone}
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  placeholder={
                    "Décris-la comme tu la décrirais à un client au téléphone.\n\nExemple : bazin riche bleu nuit, teinture faite à la main avec des motifs blancs, arrivé hier, il m'en reste 12 complets de 6 yards."
                  }
                  rows={6}
                />
                <label className={styles.champLabel} htmlFor="format">
                  Comment tu peux filmer
                </label>
                <input
                  id="format"
                  className={styles.champ}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="au téléphone, à la boutique, mains seulement…"
                />
              </>
            )}

            {mode === "score" && (
              <>
                <label className={styles.champLabel} htmlFor="script">
                  Ton script, ou juste ton accroche
                </label>
                <textarea
                  id="script"
                  className={styles.zone}
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  placeholder={
                    "Colle ici ce que tu comptes dire.\n\nExemple : « Bonjour à tous, bienvenue sur ma page, aujourd'hui je vous présente mes nouveaux bazins, prix en privé. »"
                  }
                  rows={7}
                />
              </>
            )}

            {(mode === "idees" || mode === "plan") && (
              <>
                <label className={styles.champLabel} htmlFor="sujet">
                  L&apos;angle ou le sujet du moment
                </label>
                <input
                  id="sujet"
                  className={styles.champ}
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") generer();
                  }}
                  placeholder="mon nouvel arrivage, la saison des mariages, mes prix…"
                />

                <label className={styles.champLabel}>Ce que tu cherches en priorité</label>
                <div className={styles.puces}>
                  {OBJECTIFS.map((o) => (
                    <button
                      key={o.id}
                      className={`${styles.puce} ${objectif === o.id ? styles.puceActive : ""}`}
                      onClick={() => setObjectif(o.id)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <label className={styles.champLabel} htmlFor="format-2">
                  Comment tu peux filmer
                </label>
                <input
                  id="format-2"
                  className={styles.champ}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="au téléphone, à la boutique, mains seulement…"
                />
              </>
            )}

            <button className={styles.bouton} onClick={() => generer()} disabled={charge}>
              {charge ? "Écriture en cours…" : ACTIONS[mode]}
            </button>

            {erreur && <p className={styles.erreur}>{erreur}</p>}

            {charge && (
              <p className={styles.info}>Compte une trentaine de secondes.</p>
            )}
          </section>
        )}

        {/* ---------------- Résultat : score ---------------- */}

        {analyse && !charge && (
          <article className={styles.resultat}>
            <div className={styles.resultatHaut}>
              <h2>Analyse de ton script</h2>
              <span className={styles.tag}>
                analyse {moteur === "Claude" ? "Claude" : "gratuite"}
              </span>
            </div>

            <Jauge note={analyse.note} />

            {analyse.verdict && <p className={styles.verdict}>{analyse.verdict}</p>}

            <ul className={styles.criteres}>
              {analyse.criteres.map((c) => (
                <li key={c.nom}>
                  <div className={styles.critereHaut}>
                    <strong>{c.nom}</strong>
                    <span>{c.note}/20</span>
                  </div>
                  <div className={styles.critereBarre}>
                    <div
                      className={styles.critereRemplie}
                      style={{ width: `${(c.note / 20) * 100}%` }}
                    />
                  </div>
                  <p>{c.commentaire}</p>
                </li>
              ))}
            </ul>

            {analyse.corrections.length > 0 && (
              <section className={styles.sousBloc}>
                <h3>À corriger en priorité</h3>
                <ol className={styles.corrections}>
                  {analyse.corrections.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </section>
            )}

            {analyse.hooks.length > 0 && (
              <section className={styles.sousBloc}>
                <h3>Trois accroches de remplacement</h3>
                <ul className={styles.accroches}>
                  {analyse.hooks.map((h, i) => (
                    <li key={i}>
                      <span>{h}</span>
                      <Copier texte={h} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>
        )}

        {/* ---------------- Résultat : texte ---------------- */}

        {resultat && !charge && (
          <article className={styles.resultat}>
            <div className={styles.resultatHaut}>
              <h2>
                {mode === "plan"
                  ? "Ta semaine"
                  : mode === "produit"
                    ? "Ta vidéo"
                    : "Tes idées"}
              </h2>
              <span className={styles.tag}>
                <Copier texte={resultat} libelle="Tout copier" />
              </span>
            </div>
            <div className={styles.md}>
              <Markdown texte={resultat} />
            </div>
          </article>
        )}

        <footer className={styles.footer}>
          <a href="/" className={styles.retour}>
            ← Retour au studio
          </a>
          <p>
            Les vidéos et analyses de cette page sont écrites par une IA : ce sont des
            points de départ, pas des vérités. Relis toujours avant de tourner, et vérifie
            que chaque phrase est vraie pour ta marchandise — une promesse que la
            livraison ne tient pas te coûte un client définitivement, alors qu&apos;une
            vente ratée ne coûte qu&apos;une vente. N&apos;annonce jamais une marque ou une
            qualité que tu n&apos;as pas, n&apos;invente pas de rupture de stock, et
            n&apos;achète pas de vues : les règles de TikTok l&apos;interdisent et tes
            clients s&apos;en aperçoivent.
          </p>
        </footer>
      </div>
    </div>
  );
}
