Crée dans le dossier courant un serveur MCP local « banques-images »
en Node.js, utilisant le transport STDIO, pour connecter Codex aux API
de Pexels, Unsplash et Pixabay.

CONTEXTE

Je travaille dans VS Code connecté à un serveur distant par Remote SSH.
Ce MCP doit être indépendant de mes projets de sites et réutilisable
depuis chacun d’eux.

Commence par vérifier l’environnement d’exécution, la disponibilité de
Node.js et l’emplacement de la configuration MCP utilisée par Codex.
Consulte les documentations officielles actuelles des trois API et du
SDK MCP avant l’implémentation.

AUTHENTIFICATION

Lis les clés depuis les variables d’environnement :
- PEXELS_API_KEY
- UNSPLASH_ACCESS_KEY
- PIXABAY_API_KEY

Ne les écris jamais dans le code, les fichiers versionnés, les galeries,
les manifestes ou les journaux. Masque également les clés présentes
dans les URL de requête.

Si une clé manque, indique quelle banque est indisponible et laisse
les autres fonctionner.

RECHERCHE

Expose des outils MCP permettant :
- de rechercher dans une banque ou dans les trois ;
- de préciser les mots-clés, l’orientation et le nombre de résultats ;
- de récupérer les détails d’une image par banque et identifiant ;
- de créer une galerie HTML locale ;
- de récupérer et préparer les images retenues selon les règles
  du fournisseur.

Adapte les paramètres à chaque API. Signale les filtres non pris en
charge plutôt que de les ignorer silencieusement.

Normalise les résultats dans un format commun, tout en conservant
les métadonnées originales utiles, sans secrets.

IDENTIFICATION ET DROITS

Pour chaque image, conserve :
- la banque et l’identifiant unique fourni par celle-ci ;
- l’URL de la page source ;
- le nom de l’auteur et l’URL de son profil ;
- les URL d’aperçu et d’image ;
- les dimensions et la description lorsqu’elles sont fournies ;
- le nom et l’URL de la licence applicable ;
- la date de récupération ;
- les obligations d’attribution et les règles propres à l’API ;
- le chemin local si un fichier est effectivement enregistré.

Distingue clairement :
1. les métadonnées propres à l’image ;
2. les conditions générales de la banque ;
3. les autorisations supplémentaires explicitement fournies.

Ne déduis pas une autorisation concernant les personnes, marques,
propriétés ou œuvres visibles à partir de la seule licence générale.
Pour toute information absente, indique « non fournie ».
Ne présente pas une image comme juridiquement vérifiée.

Consulte les conditions officielles actuelles et conserve une trace
datée des références utilisées.

GALERIE DE SÉLECTION

Crée une page HTML locale montrant, pour chaque emplacement prévu
du site, plusieurs images candidates numérotées.

Affiche :
- l’aperçu sans ajouter de filigrane ;
- la banque, l’identifiant, l’auteur et le lien source ;
- les dimensions ;
- les informations de licence et d’attribution ;
- l’emplacement envisagé ;
- une justification courte de la proposition, si elle est fournie ;
- un aperçu du cadrage envisagé lorsque c’est possible.

La galerie doit permettre à l’utilisateur de répondre à Codex,
par exemple : « bannière : image 2 ; formation : image 5 ».

Prévois un mode de consultation par un serveur HTTP lié à
127.0.0.1 sur le serveur distant, accessible par transfert de port SSH.
Indique le port et l’adresse à ouvrir. Ne l’expose pas publiquement.

RÉCUPÉRATION ET INTÉGRATION

Ne modifie aucun site avant validation des images retenues.

Après validation :
- récupère les images selon les conditions de chaque banque ;
- utilise le dossier de destination explicitement donné ;
- n’écrase pas un fichier existant sans instruction ;
- conserve un manifeste JSON avec la provenance, les identifiants,
  les droits documentés et les fichiers ou URL utilisés ;
- propose un texte alternatif adapté à l’usage de l’image.

Pour Unsplash, respecte notamment les obligations actuelles
d’attribution, d’utilisation des URL fournies par l’API et de
signalement des téléchargements lorsqu’il est requis.
Ne suppose pas que l’hébergement local est autorisé dans tous les cas.

FIABILITÉ ET INSTALLATION

Gère les erreurs d’authentification, les quotas, les délais d’attente
et les réponses incomplètes. Évite les téléchargements massifs.

Vérifie le fonctionnement du protocole MCP et des outils.
Si les clés ne sont pas disponibles, distingue les vérifications
locales des appels réels aux API restant à tester.

Fournis :
- le code du serveur MCP ;
- les dépendances et les commandes d’installation ;
- un README court ;
- les instructions pour définir les clés sur le serveur ;
- la configuration exacte à ajouter à Codex pour utiliser ce MCP
  depuis mes différents projets ;
- une commande de vérification et un exemple de demande de recherche.

Ne remplace pas la configuration Codex existante.
N’ajoute aucun service payant ni aucune génération d’images.