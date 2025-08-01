/**
 * Interface représentant le contenu du payload JWT
 * Compatible avec la structure de la plateforme Wanzo
 */
export interface JwtPayload {
  sub: string;                 // ID utilisateur (UUID)
  email: string;               // Email de l'utilisateur
  name?: string;               // Nom complet de l'utilisateur
  roles: string[];             // Rôles de l'utilisateur (ADMIN, USER, etc.)
  businessUnitId?: string;     // ID de l'unité commerciale (entreprise)
  features?: string[];         // Fonctionnalités auxquelles l'utilisateur a accès
  subscriptionId?: string;     // ID de l'abonnement
  subscriptionPlan?: string;   // Plan d'abonnement (FREE, PREMIUM, etc.)
  iat?: number;                // Issued at (timestamp)
  exp?: number;                // Expiration (timestamp)
  iss?: string;                // Issuer (émetteur)
  aud?: string;                // Audience
}
