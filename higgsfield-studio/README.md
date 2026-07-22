# Higgsfield Studio — Bazin Mari Falah

Espace de travail pour créer des vidéos avec **Higgsfield AI** (https://higgsfield.ai)
en combinant le plan **gratuit** de Higgsfield (sur ton téléphone) avec les
voix et photos préparées ici.

> ⚠️ Higgsfield n'a **pas d'API gratuite** et ses serveurs sont bloqués depuis
> cette session. Tout se fait donc sur **ton téléphone** : ici on prépare les
> prompts, les audios et les photos ; toi tu les colles/uploades dans Higgsfield.

## 1. Créer ton compte (gratuit)

1. Va sur **https://higgsfield.ai** dans ton navigateur.
2. Connecte-toi avec ton compte Google (le même que pour Gemini, c'est plus simple).
3. Le plan gratuit te donne : modèles de base, générations une par une, filigrane
   (watermark) sur les vidéos. Suffisant pour tester ; les plans payants
   commencent à ~15 $/mois si un jour tu veux enlever le filigrane.

## 2. Faire PARLER un personnage (Speak) — le plus important pour toi

C'est la fonction qui fait parler une photo avec les lèvres synchronisées.

1. Dans Higgsfield, ouvre l'outil **Speak** (parfois appelé "Talking avatar").
2. **Photo** : uploade la photo de ton personnage (ex. Aminata en robe cuivrée).
3. **Audio** : uploade un des MP3 du dossier [`audios/`](audios/) —
   ce sont les voix déjà générées gratuitement avec Gemini :

   | Fichier | Contenu | Durée |
   |---|---|---|
   | `aminata-temoignage.mp3` | Témoignage d'Aminata (« Le bazin de mes rêves... ») | ~24 s |
   | `conseillere-pub-25s.mp3` | Pub élégante voix féminine (robe sirène) | ~25 s |
   | `dialogue-deux-femmes.mp3` | Dialogue 2 femmes qui parlent de Bazin Mari Falah | ~30 s |
   | `pub-dioula.mp3` | Pub en dioula | ~16 s |
   | `pub-gagny-lah.mp3` | Pub tissu Gagny Lah marron | ~21 s |
   | `pub-bordeaux-violet.mp3` | Pub tissus bordeaux & violet | ~22 s |

4. Lance la génération, télécharge la vidéo.
5. (Option) Renvoie-moi la vidéo dans Claude Code : j'ajoute le bandeau
   **BAZIN MARI FALAH**, les sous-titres et l'écran final WhatsApp — gratuitement.

> Le plan gratuit limite la durée par génération. Si l'audio est trop long,
> découpe : demande-moi « coupe l'audio en morceaux de 15 secondes » et je te
> renvoie les morceaux.

## 3. Vidéos de tissus (image → vidéo cinématique)

Higgsfield est fort pour animer une photo avec des mouvements de caméra pro.

1. Outil **Image to Video** (ou "Motion").
2. Uploade la photo du tissu.
3. Colle un prompt du fichier [`prompts-bazin.md`](prompts-bazin.md)
   (mouvements caméra : dolly-in, orbite, zoom lent...).

## 4. Le circuit complet (100 % gratuit)

```
Moi (Claude Code)                  Toi (téléphone)
─────────────────                  ───────────────
1. J'écris le script       →
2. Je génère la voix MP3   →       3. Tu uploades photo + MP3 dans Speak
                                   4. Tu télécharges la vidéo
5. Je monte (marque,       ←       (tu me renvoies la vidéo)
   sous-titres, CTA)
6. Tu publies sur TikTok / Facebook / WhatsApp Status
```

## Demandes utiles à me faire

- « Génère une nouvelle voix pour Higgsfield qui dit : ... »
- « Coupe l'audio X en morceaux de 15 s »
- « Monte la vidéo Higgsfield que je viens d'envoyer »
- « Prépare un pack Higgsfield pour [personnage / tissu] »
