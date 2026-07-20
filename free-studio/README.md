# Free Studio — créas publicitaires (images + vidéos) sans abonnement

Votre mini-studio **à budget zéro**. Il ne remplace pas Arcads, mais il permet de
produire de vraies créas publicitaires gratuitement, avec votre téléphone.

> **État des lieux (vérifié en juillet 2026) :** Google a retiré la génération
> d'**images** de l'offre API gratuite (quota = 0 sans facturation). La clé
> gratuite Google AI Studio reste utile pour le **texte**. Les images gratuites
> passent donc par les applis grand public, pas par l'API.

## 1. Images — deux voies gratuites qui marchent

### Voie A : Nano Banana dans l'appli Gemini (qualité max)

1. Ouvrez **gemini.google.com** (ou l'appli Gemini) avec votre compte Google.
2. Choisissez la création d'image et collez un prompt préparé par Claude
   (inspiré des 37 templates du repo :
   `shared/skills/image-ad-prompting/prompting/prompt-library.md`).
3. Téléchargez l'image générée. Quota gratuit quotidien limité mais réel.

### Voie B : lien Pollinations (sans compte, illimité ou presque)

Pollinations génère une image gratuitement à partir d'une simple URL — aucun
compte, aucune clé. Fabriquez le lien :

```bash
python3 free-studio/make_image_link.py --format portrait --prompt "professional advertising photo of ..."
```

…puis **ouvrez le lien dans votre navigateur** : l'image apparaît, appui long
pour l'enregistrer. (Demandez à Claude de fabriquer le lien avec un prompt
optimisé — en anglais, c'est plus efficace.)

Formats : `carre` (1:1), `portrait` (4:5 feed Meta), `story` (9:16), `paysage` (16:9).

## 2. Le script API (`generate_image.py`)

Toujours là, mais il nécessite désormais un compte Google **avec facturation
activée** pour les images (l'API refuse en gratuit : « limit: 0 »). Si un jour
vous activez la facturation (~4 centimes/image), tout fonctionne sans rien
changer :

```bash
python3 free-studio/generate_image.py --prompt "..." [--ref produit.jpg]
```

## 3. Vidéos de pub — les options gratuites

Pas d'API vidéo gratuite, mais des crédits gratuits quotidiens sur les applis :

| Outil | Gratuit ? | Bon pour |
|---|---|---|
| **Gemini** (gemini.google.com) | Quelques vidéos Veo offertes/jour | Clips produits réalistes 8 s |
| **Grok Imagine** (grok.com / appli X) | Générations gratuites limitées | Clips créatifs rapides |
| **Kling** (klingai.com) | Crédits gratuits quotidiens | UGC, mouvements réalistes |
| **Hailuo / MiniMax** (hailuoai.video) | Crédits gratuits quotidiens | Variété de styles |
| **CapCut** (mobile/desktop) | Montage gratuit | Assemblage, sous-titres, musique |

### Le flux complet à budget zéro

1. **Claude écrit** le script de pub (hook, plans, CTA) + les prompts.
2. **Images clés** : voie A ou B ci-dessus.
3. **Animation** : collez les prompts vidéo dans Gemini/Kling/Grok
   (crédits gratuits quotidiens).
4. **Montage** dans CapCut : clips + voix off + sous-titres + musique.
5. Publication Meta/TikTok.

## Limites à connaître

- Quotas gratuits **quotidiens** : épuisé aujourd'hui = de retour demain.
- Les outils vidéo gratuits ajoutent parfois un filigrane.
- Pour du volume (dizaines de créas/jour), il faudra un jour un outil payant
  (Arcads, ou API Google facturée) — ce studio est fait pour démarrer sans budget.
