DOCUMENTATION API KIOTA TECH
============================

Cette documentation est destinée aux développeurs qui travaillent sur l'application KIOTA TECH et qui doivent intégrer ou maintenir les appels API.

Utilisation
----------

1. Commencez par la page README.md qui donne un aperçu global de l'API.
2. Consultez ensuite la configuration de base pour comprendre l'URL de base, les headers et le format des réponses.
3. Familiarisez-vous avec le flux d'authentification qui est crucial pour toutes les requêtes.
4. Explorez les différentes ressources (utilisateurs, entreprises, institutions financières) selon vos besoins.
5. Reportez-vous à la section "Erreurs et dépannage" en cas de problème.

Conventions
----------

- Toutes les routes API commencent par `/land/api/v1/`
- Toutes les requêtes doivent inclure un token d'authentification
- Toutes les réponses suivent le même format JSON
- Les erreurs sont documentées avec des codes d'erreur spécifiques

Environnements
-------------

- Développement: http://localhost:8000/land/api/v1
- Production: https://api.kiota.tech/land/api/v1

Structure des fichiers
---------------------

1. README.md - Vue d'ensemble de l'API
2. 01-configuration.md - Configuration de base (URLs, headers, etc.)
3. 02-authentification.md - Flux d'authentification et gestion des tokens
4. 03-utilisateurs.md - Gestion des utilisateurs
5. 04-entreprises.md - Gestion des entreprises (PME)
6. 05-institutions-financieres.md - Gestion des institutions financières
7. 06-abonnements.md - Gestion des abonnements et paiements
8. 07-erreurs.md - Codes d'erreur et dépannage

Mise à jour de la documentation
------------------------------

Cette documentation doit être mise à jour chaque fois que l'API est modifiée. Contactez l'équipe de développement pour toute suggestion ou correction.

Contact
-------

Pour toute question concernant cette documentation ou l'API, contactez:
- Email: dev@kiota.tech
- Téléphone: +243 810 987 654
