/**
 * Fiche profil — la page où se décide chaque commande.
 *
 * Quand une vidéo marche, le spectateur fait un seul geste : il ouvre le
 * profil. Si cette page ne dit pas en trois secondes ce que tu vends, où tu es
 * et comment commander, la vue est perdue — et elle a coûté aussi cher à
 * produire qu'une vue qui convertit.
 *
 * Limites réelles de TikTok : 30 caractères pour le nom affiché, 80 pour la
 * bio, 24 pour le pseudo. Le champ « lien » du profil s'ouvre à partir de
 * 1 000 abonnés.
 */

export const MAX_NOM = 30;
export const MAX_BIO = 80;
/** Au-delà, l'en-tête du profil coupe le nom avec « … ». */
export const COUPURE_NOM = 20;

export interface Verdict {
  ok: boolean;
  message: string;
}

export function validerNom(nom: string, motCle: string): Verdict[] {
  const v: Verdict[] = [];
  const n = nom.trim();

  if (!n) {
    return [{ ok: false, message: "Nom affiché vide : tu perds un emplacement indexé par la recherche." }];
  }

  v.push(
    n.length <= MAX_NOM
      ? { ok: true, message: `${n.length}/${MAX_NOM} caractères.` }
      : { ok: false, message: `${n.length}/${MAX_NOM} caractères : TikTok refusera le nom.` },
  );

  v.push(
    n.length <= COUPURE_NOM
      ? { ok: true, message: "Le nom s'affiche en entier sur ton profil." }
      : {
          ok: false,
          message: `Au-delà de ${COUPURE_NOM} caractères, l'en-tête coupe avec « … ». Raccourcis, ou mets l'essentiel au début.`,
        },
  );

  const cle = motCle.trim().toLowerCase();
  if (cle) {
    const position = n.toLowerCase().indexOf(cle);
    if (position < 0) {
      v.push({
        ok: false,
        message: `« ${motCle} » n'apparaît pas. Le nom affiché est indexé par la recherche TikTok : c'est un emplacement gratuit que tu laisses vide.`,
      });
    } else if (position > COUPURE_NOM / 2) {
      v.push({
        ok: false,
        message: `« ${motCle} » est trop loin dans le nom. Mets-le au début pour qu'il survive à la troncature.`,
      });
    } else {
      v.push({ ok: true, message: `« ${motCle} » est placé au début : trouvable en recherche.` });
    }
  }

  return v;
}

export function validerBio(bio: string): Verdict[] {
  const v: Verdict[] = [];
  const b = bio.trim();

  if (!b) {
    return [
      {
        ok: false,
        message:
          "Bio vide. C'est la correction la plus rentable qui existe : chaque visiteur de ton profil arrive sur une page qui ne lui dit rien.",
      },
    ];
  }

  v.push(
    b.length <= MAX_BIO
      ? { ok: true, message: `${b.length}/${MAX_BIO} caractères.` }
      : {
          ok: false,
          message: `${b.length}/${MAX_BIO} caractères : la fin sera coupée. Retire ${b.length - MAX_BIO} caractères.`,
        },
  );

  const quoi = /bazin|tissu|couture|wax|pagne|faso dan fani|fasodanfani|koko/i.test(b);
  v.push(
    quoi
      ? { ok: true, message: "On comprend ce que tu vends." }
      : { ok: false, message: "Dis ce que tu vends, avec le mot que les gens tapent dans la recherche." },
  );

  const ou = /ouaga|bobo|burkina|dakar|bamako|abidjan|conakry/i.test(b);
  v.push(
    ou
      ? { ok: true, message: "On sait où tu es." }
      : {
          ok: false,
          message: "Indique ta ville. C'est ce qui rassure sur la livraison et déclenche les commandes locales.",
        },
  );

  const comment = /commande|whatsapp|lien|dm|message|écri|ecri|👇|⬇/i.test(b);
  v.push(
    comment
      ? { ok: true, message: "On sait comment te joindre." }
      : { ok: false, message: "Termine par l'action : « Commande sur WhatsApp 👇 » juste au-dessus de ton lien." },
  );

  return v;
}

/** Nettoie un numéro saisi librement : espaces, tirets, +, 00 et 0 initial. */
export function normaliserNumero(indicatif: string, numero: string): string {
  const ind = indicatif.replace(/\D/g, "");
  let num = numero.replace(/\D/g, "");
  if (num.startsWith("00")) num = num.slice(2);
  if (num.startsWith(ind)) num = num.slice(ind.length);
  num = num.replace(/^0+/, "");
  return `${ind}${num}`;
}

export function lienWhatsapp(
  indicatif: string,
  numero: string,
  message: string,
): { url: string; valide: boolean } {
  const complet = normaliserNumero(indicatif, numero);
  const valide = complet.length >= 10 && complet.length <= 15;
  const texte = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : "";
  return { url: `https://wa.me/${complet}${texte}`, valide };
}

export const INDICATIFS = [
  { pays: "Burkina Faso", code: "226" },
  { pays: "Mali", code: "223" },
  { pays: "Côte d'Ivoire", code: "225" },
  { pays: "Sénégal", code: "221" },
  { pays: "Guinée", code: "224" },
  { pays: "Niger", code: "227" },
  { pays: "Togo", code: "228" },
  { pays: "Bénin", code: "229" },
  { pays: "France", code: "33" },
];

export interface ModeleBio {
  cible: string;
  texte: string;
  pourquoi: string;
}

/** Modèles tenant dans les 80 caractères, {ville} remplacé à l'usage. */
export const MODELES_BIO: ModeleBio[] = [
  {
    cible: "Grossiste — tu vends à des revendeuses",
    texte: "Bazin riche en gros · {ville}\nRevendeuses bienvenues\nCommande WhatsApp 👇",
    pourquoi:
      "Nomme ta cible dès la deuxième ligne. Une revendeuse qui se reconnaît écrit tout de suite, et elle rachètera chaque mois.",
  },
  {
    cible: "Grossiste — tu veux mettre le prix en avant",
    texte: "Bazin riche en gros · {ville}\n3 m à partir de 10 000 F\nCommande 👇",
    pourquoi:
      "Le prix filtre. Tu perds les curieux et tu gagnes du temps sur ceux qui ont vraiment le budget.",
  },
  {
    cible: "Détail — tu vends aux particuliers",
    texte: "Bazin & couture sur mesure · {ville}\nLivraison partout\nÉcris-moi 👇",
    pourquoi: "Rassure sur la livraison : c'est la première objection d'un acheteur en ligne.",
  },
  {
    cible: "Tu veux filtrer par mot-clé",
    texte: "Bazin riche · {ville}\nÉcris PRIX en commentaire\nou WhatsApp 👇",
    pourquoi:
      "Le mot-clé en commentaire nourrit l'algorithme et remplit tes messages en même temps.",
  },
];
