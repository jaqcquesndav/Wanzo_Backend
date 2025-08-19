# Outils de Sécurité XSS pour Wanzobe

Ce module fournit des outils pour protéger les applications Wanzobe contre les attaques XSS (Cross-Site Scripting).

## Installation

La dépendance `sanitize-html` a été installée dans le projet racine. Vous pouvez l'utiliser dans n'importe quel microservice.

## Utilisation

### 1. Validation et Sanétisation des DTOs

Utilisez les décorateurs personnalisés dans vos DTOs pour automatiquement sanétiser ou valider le HTML dans les entrées utilisateur.

```typescript
import { IsString, IsOptional } from 'class-validator';
import { SanitizeHtml, IsSafeHtml } from '@wanzo/shared/security';

export class CommentDto {
  @IsString()
  @SanitizeHtml() // Sanétise automatiquement le HTML
  content: string;

  @IsOptional()
  @IsString()
  @IsSafeHtml() // Rejette la requête si le HTML est dangereux
  title?: string;
}
```

### 2. Utilisation directe des fonctions de sanétisation

Vous pouvez également utiliser directement les fonctions de sanétisation dans votre code.

```typescript
import { sanitizeHtmlContent, containsDangerousHtml } from '@wanzo/shared/security';

// Sanétiser du HTML
const safeHtml = sanitizeHtmlContent(userInput);

// Vérifier si du HTML est dangereux
if (containsDangerousHtml(userInput)) {
  throw new BadRequestException('Contenu HTML non sécurisé détecté');
}
```

## Recommandations de Sécurité

1. **Toujours sanétiser les entrées utilisateur** qui pourraient contenir du HTML, en particulier :
   - Messages de chat ou commentaires
   - Descriptions ou titres
   - Texte riche ou contenu formaté

2. **Utiliser `@SanitizeHtml()`** pour les champs où du HTML est autorisé mais doit être nettoyé.

3. **Utiliser `@IsSafeHtml()`** pour les champs où aucun HTML ne devrait être présent (rejette les requêtes contenant du HTML potentiellement dangereux).

4. **Ne pas désactiver `ValidationPipe`** avec `whitelist: true` et `forbidNonWhitelisted: true`.

5. **Toujours utiliser `helmet()`** dans chaque microservice.

## Options de Configuration

Vous pouvez personnaliser les options de sanétisation en modifiant `defaultSanitizeOptions` dans `html-sanitizer.ts` ou en passant des options personnalisées aux fonctions directement :

```typescript
import { sanitizeHtmlContent } from '@wanzo/shared/security';
import sanitizeHtml from 'sanitize-html';

const customOptions: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong'],
  allowedAttributes: {}
};

const safeHtml = sanitizeHtmlContent(userInput, customOptions);
```
