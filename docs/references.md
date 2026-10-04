# Références officielles consultées

Consultation : **4 octobre 2026**, avant implémentation. Les références décrivent les règles générales des banques ; elles ne prouvent aucune autorisation spécifique concernant une image, une personne, une marque, un bâtiment ou une œuvre visible. Revoir ces sources avant déploiement d’un usage qui sort de la recherche et de la sélection.

| Source | Référence | Application |
|---|---|---|
| Pexels API | https://www.pexels.com/api/documentation/ | Authorization, recherche et détails ; orientation landscape/portrait/square ; lien visible Pexels, crédit auteur lorsque possible |
| Pexels licence | https://www.pexels.com/license/ | Licence générale et restrictions, sans preuve de droits de tiers |
| Pexels conditions | https://www.pexels.com/terms-of-service/ | Conditions du fournisseur ; pas de réplication de la banque |
| Unsplash API | https://unsplash.com/documentation | Client-ID, Accept-Version v1 ; hotlinking obligatoire ; attribution ; signalement GET /photos/:id/download ; squarish |
| Unsplash API terms | https://unsplash.com/api-terms | Conditions API distinctes de la licence générale |
| Unsplash licence | https://unsplash.com/license | Licence générale, sans permissions supplémentaires déduites |
| Pixabay API | https://pixabay.com/api/docs/ | Clé en requête masquée ; orientation horizontal/vertical ; per_page ≥ 3 ; cache 24 h ; pas de hotlinking permanent ni téléchargements massifs |
| Pixabay licence | https://pixabay.com/service/license-summary/ | Restrictions de licence générale et droits de tiers |
| Pixabay conditions | https://pixabay.com/service/terms/ | Conditions générales et licence applicable |
| SDK MCP officiel | https://github.com/modelcontextprotocol/typescript-sdk | SDK officiel ; génération v1 maintenue sur v1.x, choisie pour cette implémentation |
| Guide MCP | https://modelcontextprotocol.io/docs/develop/build-server | Transport STDIO, outils, ne pas écrire de logs sur stdout |
| Codex MCP | https://developers.openai.com/codex/mcp | Configuration globale ~/.codex/config.toml, STDIO, chemins absolus, env_vars |

La route Pexels `/api/terms-of-service/` n’a pas fourni de contenu exploitable ; la documentation API et les conditions générales ci-dessus ont été consultées. Une copie temporaire de la documentation Unsplash obtenue par Firecrawl est conservée dans `.firecrawl/` (ignorée par Git). Aucun secret dans ces références.
