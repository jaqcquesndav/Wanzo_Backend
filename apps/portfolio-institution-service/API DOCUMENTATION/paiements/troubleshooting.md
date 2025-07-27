# Erreurs courantes et dépannage

Ce document liste les erreurs les plus fréquentes rencontrées lors de l'utilisation de l'API de paiement et propose des solutions pour les résoudre.

## Codes d'erreur HTTP

| Code | Description | Cause possible | Solution |
|------|-------------|----------------|----------|
| 400 | Bad Request | Données invalides ou manquantes | Vérifier que tous les champs obligatoires sont renseignés et que le format des données est correct |
| 401 | Unauthorized | Token d'authentification manquant ou expiré | Se reconnecter pour obtenir un nouveau token |
| 403 | Forbidden | Permissions insuffisantes | Vérifier que l'utilisateur a les droits nécessaires pour effectuer cette action |
| 404 | Not Found | Ressource introuvable | Vérifier que l'ID de l'ordre de paiement existe |
| 409 | Conflict | Conflit d'état | L'action n'est pas autorisée dans l'état actuel de l'ordre de paiement |
| 422 | Unprocessable Entity | Validation échouée | Corriger les données selon les règles de validation spécifiées |
| 500 | Internal Server Error | Erreur côté serveur | Contacter l'administrateur système |

## Erreurs spécifiques

### Création d'un ordre de paiement

| Code d'erreur | Message | Solution |
|---------------|---------|----------|
| ORDER_NUMBER_EXISTS | Le numéro d'ordre existe déjà | Utiliser un autre numéro d'ordre ou laisser le système en générer un automatiquement |
| INVALID_BENEFICIARY | Les informations du bénéficiaire sont invalides | Vérifier que le nom, le numéro de compte et la banque sont correctement renseignés |
| PORTFOLIO_NOT_FOUND | Le portefeuille spécifié n'existe pas | Vérifier l'ID du portefeuille |
| INSUFFICIENT_BALANCE | Le solde du portefeuille est insuffisant | Vérifier le solde disponible ou ajuster le montant |

### Mise à jour d'un ordre de paiement

| Code d'erreur | Message | Solution |
|---------------|---------|----------|
| PAYMENT_NOT_DRAFT | L'ordre de paiement n'est plus en brouillon | Seuls les ordres en statut "draft" peuvent être modifiés |
| UNAUTHORIZED_EDIT | Non autorisé à modifier cet ordre | Seul le créateur de l'ordre ou un administrateur peut le modifier |
| INVALID_STATUS_TRANSITION | Transition de statut non autorisée | Vérifier le workflow autorisé (ex: draft → pending → approved → paid) |

### Approbation d'un ordre de paiement

| Code d'erreur | Message | Solution |
|---------------|---------|----------|
| PAYMENT_NOT_PENDING | L'ordre n'est pas en attente d'approbation | Seuls les ordres en statut "pending" peuvent être approuvés |
| UNAUTHORIZED_APPROVAL | Non autorisé à approuver cet ordre | Vérifier que l'utilisateur a un rôle d'approbateur |
| APPROVAL_LIMIT_EXCEEDED | Montant supérieur à la limite d'approbation | L'ordre doit être approuvé par un utilisateur avec une limite plus élevée |

### Paiement d'un ordre

| Code d'erreur | Message | Solution |
|---------------|---------|----------|
| PAYMENT_NOT_APPROVED | L'ordre n'est pas approuvé | Seuls les ordres approuvés peuvent être marqués comme payés |
| UNAUTHORIZED_PAYMENT | Non autorisé à effectuer le paiement | Vérifier que l'utilisateur a un rôle de comptable |
| MISSING_PAYMENT_DETAILS | Détails de paiement manquants | Fournir les informations nécessaires (référence de transaction, etc.) |

## Validation des données

### Validation du bénéficiaire

- Le nom du bénéficiaire doit contenir au moins 3 caractères
- Le numéro de compte doit respecter le format IBAN si applicable
- Le nom de la banque est obligatoire
- Le code SWIFT est obligatoire pour les paiements internationaux

### Validation des montants

- Le montant doit être un nombre positif
- Le montant doit respecter les limites définies pour le portefeuille
- Le montant doit être cohérent avec la devise spécifiée (pas de décimales pour certaines devises)

### Validation des dates

- La date de paiement ne peut pas être antérieure à la date du jour
- Pour les paiements urgents, la date doit être au maximum à J+2 jours ouvrés

## Problèmes de performance

### Lenteur lors de la récupération des ordres

Si vous constatez des lenteurs lors de la récupération des ordres de paiement :
- Limitez le nombre d'ordres récupérés en utilisant des filtres (date, statut, etc.)
- Utilisez la pagination si disponible
- Évitez de charger tous les ordres en une seule requête

### Timeout lors de la génération de rapports

Pour les rapports volumineux :
- Réduisez la période de temps
- Utilisez un groupement plus large (par mois plutôt que par jour)
- Lancez la génération en tâche de fond et récupérez le résultat ultérieurement

## Questions fréquentes

**Q: Comment générer automatiquement un numéro d'ordre ?**

R: Laissez le champ `orderNumber` vide lors de la création. Le système générera automatiquement un numéro au format OP-YYYY-XXXX.

**Q: Comment annuler un ordre déjà approuvé ?**

R: Seul un administrateur peut annuler un ordre approuvé. Utilisez l'API `cancelPayment` avec les droits administrateur.

**Q: Peut-on modifier le bénéficiaire après création ?**

R: Oui, mais uniquement si l'ordre est encore en statut "draft". Une fois soumis pour approbation, ces informations ne peuvent plus être modifiées.

**Q: Comment traiter les paiements récurrents ?**

R: Actuellement, il n'y a pas de fonctionnalité native pour les paiements récurrents. Vous devez créer manuellement un nouvel ordre pour chaque occurrence.

## Support technique

Si vous rencontrez des problèmes non résolus par ce guide :
- Consultez les logs applicatifs pour des informations détaillées
- Contactez l'équipe de support à support@wanzo.com
- Précisez toujours l'ID de l'ordre de paiement concerné et le message d'erreur exact
