# banques-images

Serveur MCP Node.js STDIO réutilisable depuis les projets Codex. Node ≥ 22 (vérifié ici : 24.14.1). Aucun service payant ni génération d’images. Les API nécessitent des comptes et clés propres à chaque fournisseur.

```bash
cd /home/debian/Outils/banques-images-mcp
npm ci
npm test
npm run verify
```

## Clés sur le serveur distant

Définir `PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, `PIXABAY_API_KEY` dans l’environnement du processus Codex distant. Pour une session CLI, saisie masquée sans valeur dans l’historique :

```bash
read -rsp 'Pexels : ' PEXELS_API_KEY; echo
read -rsp 'Unsplash : ' UNSPLASH_ACCESS_KEY; echo
read -rsp 'Pixabay : ' PIXABAY_API_KEY; echo
export PEXELS_API_KEY UNSPLASH_ACCESS_KEY PIXABAY_API_KEY
codex
```

Une clé absente désactive seulement sa banque. Ne jamais placer les valeurs dans le TOML, le dépôt ou les commandes avec valeur littérale. Pour VS Code Remote SSH, définir ces variables dans l’environnement de démarrage du serveur VS Code distant, puis redémarrer ce serveur et l’extension Codex. Un simple `export` dans un terminal déjà ouvert ne modifie pas l’environnement de l’extension. Un fichier de secrets externe au dépôt, lisible par son propriétaire uniquement (`chmod 600`), peut être chargé par votre mécanisme de démarrage ; ce MCP ne charge pas automatiquement de `.env`.

## Configuration Codex

Ajouter le bloc de [codex-mcp.toml](codex-mcp.toml) au fichier global `/home/debian/.codex/config.toml`, sans remplacer les entrées existantes. Le bloc utilise des chemins absolus, fonctionne depuis chaque projet et transmet les clés par `env_vars`. Le fichier existant n’a pas été modifié. Dans VS Code, ouvrir les réglages MCP de Codex et vérifier que ce fichier global appartient bien au processus Codex distant. Si Codex tourne sur une autre machine, ce chemin de serveur n’y sera pas accessible.

Redémarrer Codex ; vérifier les sept outils avec `/mcp` en CLI ou la liste MCP de l’extension.

## Utilisation

> Recherche 6 photos par banque dans Pexels, Unsplash et Pixabay pour « formation en équipe », orientation paysage. Propose plusieurs candidats pour les emplacements bannière et formation, puis crée une galerie dans /tmp/selection-images et sers-la sur 127.0.0.1. Attends ma sélection avant de préparer les images.

- `status` : banques disponibles, sans secrets.
- `search_images` : `bank` = `all|pexels|unsplash|pixabay`, `query`, `orientation` = `all|landscape|portrait|square`, `count` (1–30 **par banque**), `page`. Pixabay refuse square ; Unsplash adapte square à squarish avec avertissement. Les autres filtres ne font pas partie du schéma.
- `image_details` : `bank`, `id`.
- `create_gallery` : `destination` absolue, `slots: [{name, aspect_ratio: 2, candidates: [{bank,id,reason}]}]` ; maximum 30 candidats. Les détails sont récupérés à la source ; aucune URL arbitraire n’est acceptée en entrée.
- `serve_gallery` : `html_path` retourné dans la même session, `port` optionnel (0 choisit un port libre). Transférer le port retourné dans l’onglet Ports de VS Code, puis ouvrir `http://127.0.0.1:PORT/`. Alternative : `ssh -N -L PORT:127.0.0.1:PORT utilisateur@serveur`. Écoute exclusivement sur 127.0.0.1 ; cesse avec le MCP.
- `stop_gallery` : `port`.
- `prepare_images` : `confirmed: true` seulement après réponse utilisateur, `destination` absolue explicitement donnée, `selections: [{bank,id,placement,alt_text}]` ; maximum 10. Fournir un alt contextualisé, ou le serveur émet une proposition à vérifier. Les fichiers existants ne sont jamais remplacés. Le manifeste unique conserve les réussites et erreurs partielles. Aucun fichier de code de site n’est modifié.

Réponse de sélection possible : « bannière : image 2 ; formation : image 5 ». Les numéros sont globaux dans la galerie et reliés aux identifiants dans son JSON. Le cadrage est une simulation CSS centrée ; aucun fichier image n’est recadré.

## Règles et limites

Unsplash : crédits avec liens de suivi, URL CDN de l’API conservée ; la sélection validée déclenche le signalement de téléchargement, sans copie locale. Pixabay : cache disque de réponses 24 h (ignoré par Git), aperçu temporaire et copie locale pour utilisation permanente. Pexels : lien visible vers la banque, crédit du photographe lorsque possible. Les métadonnées originales utiles sont conservées après masquage des secrets. Les conditions générales sont séparées des droits propres à l’image ; releases et autorisations supplémentaires absentes : « non fournie ». Aucune image n’est présentée comme juridiquement vérifiée. Voir [les références datées](docs/references.md).

Délais API 15 s, image 30 s, maximum 25 Mo/image, sans nouvelle tentative automatique ni pagination massive. Les erreurs HTTP, quotas, clés absentes et réponses incomplètes sont explicites. Les redirections de téléchargement sont refusées et les hôtes limités aux CDN des fournisseurs. Si un fournisseur change son domaine ou ses conditions, revoir l’adaptateur. Les URL Pixabay peuvent expirer : régénérer la galerie après 24 h. Le serveur doit avoir accès réseau aux API/CDN et aux dossiers explicitement demandés.

## Vérification

`npm test` : tests locaux avec réponses simulées, fichiers temporaires, HTTP loopback. `npm run verify` : vrai échange MCP STDIO, liste des outils, recherche sans clés, refus d’une préparation non validée. `npm run verify -- --live` : recherche réelle d’une image par banque disposant d’une clé ; pas de téléchargement. Les clés étaient absentes lors de l’installation : appels réels, validité des clés et comportement de téléchargement des CDN restent à tester. Les tests simulés ne certifient pas les API externes.
