# Documentation d'administration de Comptable IA API

## Configuration du token administrateur

Pour créer le premier compte administrateur, vous devez utiliser un "token administrateur". Ce token est une clé de sécurité qui protège la création des comptes avec privilèges d'administration.

### Obtention du token administrateur

Il y a trois façons d'obtenir/configurer le token administrateur:

1. **Par variable d'environnement** (recommandé pour la production):
   ```bash
   # Linux/macOS
   export ADMIN_TOKEN="votre_token_secret_ici"
   
   # Windows (PowerShell)
   $env:ADMIN_TOKEN="votre_token_secret_ici"
   
   # Windows (CMD)
   set ADMIN_TOKEN=votre_token_secret_ici
   ```

2. **Par configuration dans `settings.py`**:
   Modifiez la variable `ADMIN_SIGNUP_TOKEN` dans le fichier `comptable_ia_api/settings.py`:
   ```python
   ADMIN_SIGNUP_TOKEN = 'votre_token_secret_ici'
   ```

3. **Valeur par défaut** (uniquement pour le développement):
   Si aucune des méthodes ci-dessus n'est utilisée, le token par défaut est `comptable_ia_admin_token`.
   **AVERTISSEMENT**: Ne jamais utiliser cette valeur par défaut en production!

### Création d'un compte administrateur

Une fois que vous avez configuré le token administrateur, vous pouvez créer un compte administrateur:

1. Envoyez une requête POST à l'endpoint `/api/admin/signup/` avec les données suivantes:
   ```json
   {
     "email": "admin@example.com",
     "password": "mot_de_passe_securise",
     "first_name": "Admin",
     "last_name": "User",
     "admin_token": "votre_token_secret_ici"
   }
   ```

2. Si le token est valide, un compte administrateur sera créé et un token JWT vous sera retourné.

### Bonnes pratiques de sécurité

- Utilisez un token fort et complexe (au moins 32 caractères)
- Ne stockez jamais le token directement dans le code
- Utilisez des variables d'environnement en production
- Changez régulièrement le token, surtout après la création des administrateurs initiaux
- Limitez l'accès au serveur où le token est configuré

## Gestion des utilisateurs

Après avoir créé un compte administrateur, vous pouvez gérer les autres utilisateurs via les endpoints suivants:

- `GET /api/admin/users/` - Liste tous les utilisateurs
- `POST /api/admin/users/` - Crée un nouvel utilisateur (non-admin par défaut)
- `GET /api/admin/users/{user_id}/` - Obtient les détails d'un utilisateur
- `PUT /api/admin/users/{user_id}/` - Met à jour les informations d'un utilisateur
- `DELETE /api/admin/users/{user_id}/` - Supprime un utilisateur

Ces endpoints nécessitent que vous soyez connecté avec un compte administrateur et que vous fournissiez le token JWT dans l'en-tête `Authorization`.
