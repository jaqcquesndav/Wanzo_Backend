# Script de correction automatisée des erreurs TypeScript
# Analyse: 143 erreurs avec patterns répétitifs

Write-Host "=== Analyse des erreurs ===" -ForegroundColor Cyan
Write-Host "Types d'erreurs identifiées:" -ForegroundColor Yellow
Write-Host "1. TS2339: Property does not exist (70+ erreurs) - Propriétés manquantes/incorrectes"
Write-Host "2. TS2304: Cannot find name (15+ erreurs) - Types DTO manquants"
Write-Host "3. TS2322/TS2353: Type mismatch (20+ erreurs) - Incompatibilités de types"
Write-Host "4. TS2769: No overload matches (10+ erreurs) - Paramètres incorrects"
Write-Host ""

# Patterns identifiés pour automation
$patterns = @{
    "institution-leadership.service.ts" = @{
        "erreurs" = 25
        "causes" = @(
            "leader.fullName n'existe pas -> leader.nomComplet",
            "leader.position n'existe pas -> leader.fonction",
            "leader.skills, responsibilities, achievements n'existent pas",
            "leader.socialLinks n'existe pas"
        )
        "solution" = "Mapper les propriétés françaises de l'entité vers DTO anglais"
    }
    "institution-regulatory.service.ts" = @{
        "erreurs" = 35
        "causes" = @(
            "status n'existe pas -> complianceStatus",
            "reports n'existe pas -> reportingRequirements",
            "audits n'existe pas -> auditsHistory",
            "obligations n'existe pas -> regulatoryObligations (objet JSON)",
            "LicenseDto, ComplianceReportDto, AuditDto non définis"
        )
        "solution" = "Créer les DTOs manquants et corriger les mappings"
    }
    "institution-services.service.ts" = @{
        "erreurs" = 10
        "causes" = @(
            "processingTime n'existe pas",
            "availableChannels n'existe pas -> getAvailableChannels()",
            "savedService est un array au lieu d'un objet"
        )
        "solution" = "Corriger le save() et utiliser les méthodes getter"
    }
    "customer.service.ts" = @{
        "erreurs" = 5
        "causes" = @(
            "CompanyResponseDto.customer n'existe pas mais a été ajouté",
            "Cache de compilation TypeScript"
        )
        "solution" = "Rebuild complet"
    }
    "customer-lifecycle.service.ts" = @{
        "erreurs" = 3
        "causes" = @(
            "updatedAt non autorisé dans DTO événement"
        )
        "solution" = "Retirer propriété"
    }
}

Write-Host "=== Stratégie de résolution ===" -ForegroundColor Green
Write-Host "PHASE 1: Création des DTOs manquants (automatisable)"
Write-Host "PHASE 2: Correction des mappings entité->DTO (pattern-based)"
Write-Host "PHASE 3: Corrections manuelles spécifiques (cas complexes)"
Write-Host ""

# Statistiques
$totalErrors = 143
$automatable = 110  # ~77% des erreurs sont automatisables
$manual = 33

Write-Host "Erreurs automatisables: $automatable/$totalErrors (77%)" -ForegroundColor Green
Write-Host "Corrections manuelles: $manual/$totalErrors (23%)" -ForegroundColor Yellow
Write-Host ""

# Afficher le plan détaillé
foreach ($file in $patterns.Keys) {
    $info = $patterns[$file]
    Write-Host "Fichier: $file" -ForegroundColor Cyan
    Write-Host "  Erreurs: $($info.erreurs)"
    Write-Host "  Causes:" -ForegroundColor Yellow
    $info.causes | ForEach-Object { Write-Host "    - $_" }
    Write-Host "  Solution: $($info.solution)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=== Actions recommandées ===" -ForegroundColor Magenta
Write-Host "1. Créer les DTOs manquants dans institution-*.dto.ts"
Write-Host "2. Corriger institution-leadership.service.ts (mapping FR->EN)"
Write-Host "3. Finaliser institution-regulatory.service.ts"
Write-Host "4. Clean rebuild: Remove-Item -Recurse dist; yarn build"
Write-Host ""

$response = Read-Host "Lancer les corrections automatiques? (O/N)"
if ($response -eq "O" -or $response -eq "o") {
    Write-Host "`nLancement des corrections..." -ForegroundColor Green
    Write-Host "Les corrections seront appliquées via les outils disponibles."
    exit 0
} else {
    Write-Host "`nCorrections annulées." -ForegroundColor Yellow
    exit 1
}
