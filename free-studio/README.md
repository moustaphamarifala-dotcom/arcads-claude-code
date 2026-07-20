# Free Studio — images Nano Banana + pubs vidéo, sans abonnement Arcads

Ce dossier est votre mini-studio **100 % gratuit** (dans la limite des quotas gratuits
des services utilisés). Il ne remplace pas Arcads, mais il permet de produire de
vraies créas publicitaires sans abonnement.

## 1. Images Nano Banana — via la clé gratuite de Google

**Nano Banana** est le modèle d'images de Google (Gemini). Google donne une clé API
**gratuite** avec un quota quotidien — largement assez pour tester et produire des
visuels de pub.

### Configuration (une seule fois)

1. Allez sur **<https://aistudio.google.com/apikey>** (connexion avec votre compte
   Google — gratuit, pas de carte bancaire).
2. Cliquez sur **« Create API key »** et copiez la clé.
3. Dans le fichier `.env` à la racine du repo, ajoutez :

   ```
   GEMINI_API_KEY=votre_cle_ici
   ```

### Générer une image

```bash
python3 free-studio/generate_image.py --prompt "Photo publicitaire studio d'une bouteille de jus de bissap, fond dégradé rouge, éclairage doux, style premium, texte 'FRAIS & NATUREL' en haut"
```

Avec une photo de votre produit comme référence :

```bash
python3 free-studio/generate_image.py --ref ma-photo-produit.jpg --prompt "Place ce produit dans un décor de plage tropicale au coucher du soleil, style publicité Meta haut de gamme"
```

Plusieurs variantes d'un coup :

```bash
python3 free-studio/generate_image.py --count 3 --prompt "..."
```

Les images arrivent dans `free-studio/outputs/`.

**Astuce :** les 37 templates de prompts validés du repo
(`shared/skills/image-ad-prompting/prompting/prompt-library.md`) fonctionnent
très bien avec ce script — demandez à Claude d'en adapter un à votre produit.

**Note :** le quota gratuit couvre le modèle Nano Banana standard
(`gemini-2.5-flash-image`). La version **Pro** (`gemini-3-pro-image-preview`)
nécessite un compte facturé chez Google — le script accepte `--model` si vous
l'activez un jour.

## 2. Vidéos de pub — les options gratuites qui marchent

Il n'existe pas d'API vidéo gratuite fiable, mais plusieurs outils grand public
offrent des générations gratuites chaque jour. La méthode : **Claude écrit le
script + le prompt vidéo ici, vous le collez dans l'outil.**

| Outil | Gratuit ? | Bon pour |
|---|---|---|
| **Gemini** (gemini.google.com) | Quelques vidéos Veo offertes/jour avec un compte Google | Clips produits réalistes 8 s |
| **Grok Imagine** (grok.com / app X) | Générations gratuites limitées | Clips créatifs rapides |
| **Kling** (klingai.com) | Crédits gratuits quotidiens à la connexion | UGC, mouvements réalistes |
| **Hailuo / MiniMax** (hailuoai.video) | Crédits gratuits quotidiens | Variété de styles |
| **CapCut** (mobile/desktop) | Montage gratuit | Assembler les clips, sous-titres, musique |

### Le flux de travail complet (gratuit)

1. **Demandez à Claude** : « écris-moi un script de pub de 30 s pour [produit] avec
   3 plans » — vous obtenez le script, les prompts vidéo plan par plan, et les
   textes d'annonce.
2. **Générez les images clés** avec `generate_image.py` (gratuit).
3. **Animez** chaque plan dans Gemini/Kling/Grok avec les prompts fournis
   (crédits gratuits quotidiens).
4. **Assemblez** dans CapCut : clips + voix off + sous-titres + musique.
5. Publiez sur Meta/TikTok.

## Limites à connaître

- Les quotas gratuits sont **quotidiens** : si le script répond « quota épuisé »,
  ça revient le lendemain.
- Les outils vidéo gratuits ajoutent parfois un filigrane (watermark).
- Pour du volume sérieux (dizaines de créas/jour), un abonnement payant
  (Arcads ou autre) reste la seule voie — ce studio est fait pour démarrer
  sans budget.
