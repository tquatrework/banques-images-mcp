Pour Unsplash, impose un fonctionnement interactif :

- recherche uniquement à la demande explicite de l’utilisateur ;
- aucune recherche planifiée ou en arrière-plan ;
- maximum 2 requêtes de recherche et 12 candidats par demande ;
- aucune pagination automatique ;
- une seule requête API à la fois, avec 2 secondes minimum entre appels ;
- budget maximal de 40 appels API par heure, tous outils confondus,
  sans dépasser le quota communiqué par Unsplash ;
- réutilisation des résultats déjà obtenus lorsque les règles le permettent ;
- arrêt sur quota épuisé, sans boucle de tentatives ;
- aucune récupération massive ;
- utilisation d’une image uniquement après choix explicite de l’utilisateur.

Respecte aussi l’attribution, les URL d’affichage fournies par Unsplash
et le signalement requis lorsqu’une image est sélectionnée pour utilisation.