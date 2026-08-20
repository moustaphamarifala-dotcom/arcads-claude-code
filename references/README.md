# references/ — médias de référence (locaux)

Ce dossier alimente les workflows du pack de skills Arcads : visages d'influenceurs IA,
photos de produits, planches de style, exemples de rendus.

**Rien ici n'est versionné** (voir `.gitignore`) — comme dans le dépôt amont, les médias
restent sur votre machine.

## Récupérer la bibliothèque d'exemples du dépôt amont

```bash
./scripts/fetch-arcads-references.sh
```

Environ 119 Mo : 13 influenceurs IA (10 images chacun), des photos produit et des
exemples de UGC stills, téléchargés depuis
[krusemediallc/arcads-claude-code](https://github.com/krusemediallc/arcads-claude-code).
Le script n'écrase jamais un fichier que vous avez déjà déposé.

## Organisation

| Dossier | Contenu |
|---|---|
| `influencers/` | Planches de personnage (10 images par influenceur) — un dossier par influenceur, nommé `prenom-cheveux-traits-yeux-teint` |
| `products/` | Photos de vos produits, utilisées comme références d'image |
| `aesthetics/` | Planches de style / d'ambiance (ex. `ugc-selfie/`) |
| `examples/` | Rendus d'exemple produits par les skills |

Déposez simplement vos propres fichiers dans le dossier correspondant : les skills les
retrouvent par leur chemin.
