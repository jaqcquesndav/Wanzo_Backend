# Exemples d'utilisation des décorateurs de sanétisation HTML

Ce document contient des exemples d'utilisation des décorateurs `@SanitizeHtml()` et `@IsSafeHtml()` pour protéger votre application contre les attaques XSS.

## Installation

Assurez-vous que `sanitize-html` est installé dans votre projet :

```bash
npm install sanitize-html
npm install @types/sanitize-html --save-dev
```

## Exemple 1: DTO pour création de chat

```typescript
import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@wanzo/shared/security';

export class CreateChatDto {
  @ApiProperty({ description: 'Titre du chat' })
  @IsString()
  @SanitizeHtml() // Sanétise automatiquement le HTML dans le titre
  title!: string;

  @ApiProperty({ description: 'Statut actif du chat' })
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Contexte agrégé' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

## Exemple 2: DTO pour création de message

```typescript
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SanitizeHtml } from '@wanzo/shared/security';

export enum MessageRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant'
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Rôle du message', enum: MessageRole })
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  @SanitizeHtml() // Sanétise automatiquement le HTML dans le contenu
  content!: string;

  @ApiPropertyOptional({ description: 'Source d\'information' })
  @IsOptional()
  @IsString()
  @SanitizeHtml() // Sanétise automatiquement le HTML dans la source
  source?: string;

  @ApiPropertyOptional({ description: 'Métadonnées supplémentaires' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

## Exemple 3: DTO pour filtrage avec IsSafeHtml

```typescript
import { IsString, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsSafeHtml } from '@wanzo/shared/security';

export class ChatFilterDto {
  @ApiPropertyOptional({ description: 'Filtrer par company ID' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut actif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Terme de recherche' })
  @IsOptional()
  @IsString()
  @IsSafeHtml() // Vérifie que le terme de recherche ne contient pas de HTML dangereux
  search?: string;
}
```

## Différence entre SanitizeHtml et IsSafeHtml

- `@SanitizeHtml()` : Nettoie automatiquement le HTML dangereux en conservant le HTML sûr.
- `@IsSafeHtml()` : Vérifie si la chaîne contient du HTML dangereux et rejette la requête si c'est le cas.

## Cas d'utilisation recommandés

- Utilisez `@SanitizeHtml()` pour les champs qui peuvent contenir du HTML formaté (descriptions, messages, commentaires).
- Utilisez `@IsSafeHtml()` pour les champs qui ne devraient pas contenir de HTML du tout (termes de recherche, noms d'utilisateur).
