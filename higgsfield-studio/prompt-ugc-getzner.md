# Prompt vidéo UGC — Bazin Getzner Siri Siri

À coller dans **Higgsfield** (Speak / Image to Video) ou **Grok Imagine**,
avec une photo de la femme + le tissu comme référence. Pense à uploader
une photo réelle (visage net) — pas une image déjà générée par IA.

---

## Prompt principal (à copier-coller)

```
Une jeune femme africaine tient et présente fièrement un tissu bazin riche
violet et noir aux motifs tie-dye, dans une chambre à coucher simple et
chaleureuse, lumière naturelle légèrement surexposée par la fenêtre.

Elle parle directement à la caméra, avec des micro-mouvements naturels :
elle rompt le contact visuel deux fois pour regarder le tissu, incline
légèrement la tête, ajuste sa prise sur le tissu avec les doigts, léger
transfert de poids d'un pied sur l'autre. Elle n'est jamais figée comme
une statue.

Style caméra : vidéo filmée au téléphone à la main, léger flou de
mouvement, cadrage légèrement décentré, grain visible, pas de stabilisateur
— comme une vraie vidéo TikTok, pas une publicité léchée.

Peau réaliste : pores visibles, légère variation de teint, léger cerne sous
les yeux, un peu de brillance naturelle sur le front — pas de peau
lisse et retouchée.

Elle dit en français, sur un ton spontané et sincère, pas du tout scripté :
"Regardez ce tissu... Bazin Getzner Siri Siri, violet royal, cinq mètres.
Sérieux, la qualité est incroyable. C'est chez Bazin Mari Falah. Écrivez-leur
sur WhatsApp, au cinq cinq, treize, trente-quatre, quatorze."

Pas de sous-titres, pas de texte incrusté, pas de logo à l'écran.
```

## Pourquoi ce prompt est construit ainsi

- **Bloc imperfections caméra** — sans ça, la plupart des modèles vidéo
  sortent un rendu trop léché, qui sent la pub et pas le contenu organique.
- **Bloc réalisme de peau** — évite l'effet "poupée de cire" que les IA
  vidéo produisent par défaut sur les visages.
- **Mouvements humains obligatoires** (regard, tête, mains, poids du corps)
  — sans ça, le sujet reste figé comme un mannequin.
- **"Pas de sous-titres"** — beaucoup de modèles incrustent des sous-titres
  automatiques moches par défaut ; ce clause les désactive.
- **Texte à dire écrit noir sur blanc** — certains modèles (Grok Imagine)
  génèrent leur propre voix à partir de ce texte ; d'autres (Higgsfield
  Speak) ignorent cette partie et utilisent ton fichier audio uploadé à la
  place — les deux cas sont couverts.

## Pour l'adapter à un autre tissu/couleur

Remplace seulement ces 3 éléments dans le prompt :
1. La couleur/description du tissu ("violet et noir aux motifs tie-dye")
2. Le nom du modèle ("Bazin Getzner Siri Siri, violet royal, cinq mètres")
3. La photo que tu uploades

Tout le reste (imperfections caméra, réalisme peau, mouvements, numéro
WhatsApp) reste identique — c'est le squelette réutilisable.
