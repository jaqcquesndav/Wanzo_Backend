# API des Échéanciers de Paiement

Cette API permet de gérer les échéanciers de paiement (payment schedules) liés aux contrats de crédit, incluant la génération, la consultation, la mise à jour et la simulation des échéances.

## Points d'accès

### Liste des échéanciers de paiement

Récupère la liste de tous les échéanciers de paiement.

**Endpoint** : `GET /portfolios/traditional/payment-schedules`

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": [
    {
      "id": "schedule-001",
      "contract_id": "contract-123",
      "due_date": "2025-02-15",
      "principal_amount": 3750.00,
      "interest_amount": 833.33,
      "total_amount": 4583.33,
      "status": "pending",
      "installment_number": 1,
      "payment_date": null,
      "paid_amount": null,
      "remaining_amount": 4583.33,
      "payment_id": null,
      "late_fee_amount": null,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "schedule-002",
      "contract_id": "contract-123",
      "due_date": "2025-03-15",
      "principal_amount": 3750.00,
      "interest_amount": 781.25,
      "total_amount": 4531.25,
      "status": "paid",
      "installment_number": 2,
      "payment_date": "2025-03-14T14:30:00.000Z",
      "paid_amount": 4531.25,
      "remaining_amount": 0,
      "payment_id": "payment-456",
      "late_fee_amount": 0,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-03-14T14:30:00.000Z"
    }
  ]
}
```

### Détails d'un échéancier de paiement

Récupère les détails d'un échéancier de paiement spécifique.

**Endpoint** : `GET /portfolios/traditional/payment-schedules/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'échéancier

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "schedule-001",
    "contract_id": "contract-123",
    "due_date": "2025-02-15",
    "principal_amount": 3750.00,
    "interest_amount": 833.33,
    "total_amount": 4583.33,
    "status": "pending",
    "installment_number": 1,
    "payment_date": null,
    "paid_amount": null,
    "remaining_amount": 4583.33,
    "payment_id": null,
    "late_fee_amount": null,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

### Création d'un échéancier de paiement

Crée un nouvel échéancier de paiement.

**Endpoint** : `POST /portfolios/traditional/payment-schedules`

**Corps de la requête** :

```json
{
  "contract_id": "contract-123",
  "due_date": "2025-04-15",
  "principal_amount": 3750.00,
  "interest_amount": 729.17,
  "total_amount": 4479.17,
  "installment_number": 3
}
```

**Réponse réussie** (201 Created) :

```json
{
  "success": true,
  "data": {
    "id": "schedule-003",
    "contract_id": "contract-123",
    "due_date": "2025-04-15",
    "principal_amount": 3750.00,
    "interest_amount": 729.17,
    "total_amount": 4479.17,
    "status": "pending",
    "installment_number": 3,
    "payment_date": null,
    "paid_amount": null,
    "remaining_amount": 4479.17,
    "payment_id": null,
    "late_fee_amount": null,
    "created_at": "2025-11-19T10:00:00.000Z",
    "updated_at": "2025-11-19T10:00:00.000Z"
  }
}
```

### Mise à jour d'un échéancier de paiement

Met à jour un échéancier de paiement existant (typiquement le statut après paiement).

**Endpoint** : `PUT /portfolios/traditional/payment-schedules/{id}`

**Paramètres de chemin** :
- `id` : Identifiant unique de l'échéancier

**Corps de la requête** :

```json
{
  "status": "paid",
  "payment_date": "2025-11-19T15:30:00.000Z",
  "paid_amount": 4583.33,
  "remaining_amount": 0,
  "payment_id": "payment-789"
}
```

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "id": "schedule-001",
    "contract_id": "contract-123",
    "due_date": "2025-02-15",
    "principal_amount": 3750.00,
    "interest_amount": 833.33,
    "total_amount": 4583.33,
    "status": "paid",
    "installment_number": 1,
    "payment_date": "2025-11-19T15:30:00.000Z",
    "paid_amount": 4583.33,
    "remaining_amount": 0,
    "payment_id": "payment-789",
    "late_fee_amount": 0,
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-11-19T15:30:00.000Z"
  }
}
```

### Simulation d'un échéancier de paiement

Simule un échéancier de paiement sans l'enregistrer en base de données.

**Endpoint** : `POST /portfolios/traditional/payment-schedules/simulate`

**Corps de la requête** :

```json
{
  "principal_amount": 50000.00,
  "interest_rate": 12.5,
  "term_months": 12,
  "start_date": "2025-12-01",
  "amortization_type": "constant",
  "payment_frequency": "monthly"
}
```

**Paramètres** :
- `principal_amount` : Montant du capital à rembourser
- `interest_rate` : Taux d'intérêt annuel (pourcentage)
- `term_months` : Durée du prêt en mois
- `start_date` : Date de début du prêt (format ISO 8601)
- `amortization_type` : Type d'amortissement (`constant`, `degressive`, `balloon`, `bullet`)
- `payment_frequency` : Fréquence de paiement (`monthly`, `quarterly`, `semiannual`, `annual`)

**Réponse réussie** (200 OK) :

```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "installment_number": 1,
        "due_date": "2026-01-01",
        "principal_amount": 3750.00,
        "interest_amount": 520.83,
        "total_amount": 4270.83,
        "remaining_balance": 46250.00
      },
      {
        "installment_number": 2,
        "due_date": "2026-02-01",
        "principal_amount": 3750.00,
        "interest_amount": 481.77,
        "total_amount": 4231.77,
        "remaining_balance": 42500.00
      },
      {
        "installment_number": 3,
        "due_date": "2026-03-01",
        "principal_amount": 3750.00,
        "interest_amount": 442.71,
        "total_amount": 4192.71,
        "remaining_balance": 38750.00
      }
      // ... autres échéances
    ],
    "summary": {
      "total_principal": 50000.00,
      "total_interest": 3437.50,
      "total_amount": 53437.50,
      "number_of_payments": 12,
      "monthly_payment_avg": 4453.13
    }
  }
}
```

## Modèles de données

### PaymentSchedule (Échéancier de paiement)

| Champ | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Identifiant unique de l'échéance |
| contract_id | string (UUID) | Identifiant du contrat de crédit associé |
| due_date | date | Date d'échéance de paiement |
| principal_amount | decimal(15,2) | Montant du capital à rembourser pour cette échéance |
| interest_amount | decimal(15,2) | Montant des intérêts pour cette échéance |
| total_amount | decimal(15,2) | Montant total de l'échéance (capital + intérêts) |
| status | enum | Statut de l'échéance (`pending`, `paid`, `partial`, `late`, `defaulted`) |
| installment_number | integer | Numéro de l'échéance dans le calendrier de paiement |
| payment_date | timestamp | Date du paiement effectif (nullable) |
| paid_amount | decimal(15,2) | Montant réellement payé (nullable) |
| remaining_amount | decimal(15,2) | Montant restant dû (nullable) |
| payment_id | string | Identifiant du paiement lié (nullable) |
| late_fee_amount | decimal(15,2) | Montant des pénalités de retard (nullable) |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de dernière mise à jour |

### Statuts des échéances

| Statut | Description |
|--------|-------------|
| `pending` | En attente de paiement |
| `paid` | Payée intégralement |
| `partial` | Partiellement payée |
| `late` | En retard de paiement |
| `defaulted` | En défaut de paiement |

### Types d'amortissement

| Type | Description |
|------|-------------|
| `constant` | Mensualités constantes (amortissement linéaire du capital avec intérêts dégressifs) |
| `degressive` | Remboursement du capital constant avec intérêts dégressifs |
| `balloon` | Paiements réduits avec solde important à la fin (balloon payment) |
| `bullet` | Paiement du capital en une seule fois à la fin (uniquement intérêts pendant la durée) |
| `custom` | Échéancier personnalisé défini manuellement |

### Fréquences de paiement

| Fréquence | Description |
|-----------|-------------|
| `monthly` | Mensuelle (12 paiements par an) |
| `quarterly` | Trimestrielle (4 paiements par an) |
| `semiannual` | Semestrielle (2 paiements par an) |
| `annual` | Annuelle (1 paiement par an) |

## Structure TypeScript

```typescript
enum PaymentScheduleStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  LATE = 'late',
  DEFAULTED = 'defaulted'
}

interface PaymentSchedule {
  id: string;
  contract_id: string;
  due_date: Date;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  status: PaymentScheduleStatus;
  installment_number: number;
  payment_date?: Date;
  paid_amount?: number;
  remaining_amount?: number;
  payment_id?: string;
  late_fee_amount?: number;
  created_at: Date;
  updated_at: Date;
}

interface ScheduleGenerationParams {
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  start_date: string;
  amortization_type: 'constant' | 'degressive' | 'balloon' | 'bullet' | 'custom';
  payment_frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}

interface SimulatedSchedule {
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  remaining_balance: number;
}

interface ScheduleSimulationResponse {
  schedules: SimulatedSchedule[];
  summary: {
    total_principal: number;
    total_interest: number;
    total_amount: number;
    number_of_payments: number;
    monthly_payment_avg: number;
  };
}
```

## Gestion des erreurs

| Code HTTP | Code d'erreur | Description |
|-----------|---------------|-------------|
| 400 | INVALID_SCHEDULE_DATA | Données d'échéancier invalides |
| 404 | SCHEDULE_NOT_FOUND | Échéancier non trouvé |
| 404 | CONTRACT_NOT_FOUND | Contrat de crédit non trouvé |
| 400 | INVALID_SIMULATION_PARAMS | Paramètres de simulation invalides |
| 403 | INSUFFICIENT_PERMISSIONS | Permissions insuffisantes |

## Formules de calcul

### Amortissement Constant (type: `constant`)

Mensualité fixe calculée par :
```
M = P * [i * (1 + i)^n] / [(1 + i)^n - 1]
```

Où :
- M = Mensualité
- P = Capital (principal_amount)
- i = Taux d'intérêt mensuel (interest_rate / 12 / 100)
- n = Nombre de mensualités (term_months)

### Amortissement Dégressif (type: `degressive`)

Capital remboursé constant :
```
Capital par échéance = P / n
Intérêts échéance k = (P - (k-1) * Capital par échéance) * i
Mensualité k = Capital par échéance + Intérêts échéance k
```

### Balloon Payment (type: `balloon`)

Paiements réduits avec solde final :
```
M = (P - B) * [i * (1 + i)^n] / [(1 + i)^n - 1]
Dernier paiement = M + B
```

Où :
- B = Balloon payment (généralement 20-50% de P)

---

**Note importante** : Les échéanciers sont générés automatiquement lors de la création d'un contrat de crédit. La modification manuelle des échéanciers doit être effectuée avec précaution car elle impacte les remboursements et les métriques du portefeuille.

*Documentation créée le 19 novembre 2025*
