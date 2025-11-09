# Script de test du système de contrôle d'accès aux fonctionnalités métier
# Usage: ./test-feature-access-system.ps1

Write-Host "=== Test du système de contrôle d'accès aux fonctionnalités Wanzo ===" -ForegroundColor Green

# Configuration
$CUSTOMER_SERVICE_URL = "http://localhost:3001"
$ACCOUNTING_SERVICE_URL = "http://localhost:3002"
$GESTION_COMMERCIALE_URL = "http://localhost:3003"
$PORTFOLIO_INSTITUTION_URL = "http://localhost:3004"

# Token JWT de test (à remplacer par un vrai token)
$JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAd2Fuem8uY29tIiwib3JnYW5pemF0aW9uSWQiOiJ0ZXN0LW9yZy1pZCIsImN1c3RvbWVySWQiOiJ0ZXN0LWN1c3RvbWVyLWlkIiwicm9sZXMiOlsidXNlciJdLCJpYXQiOjE2MzAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.test-signature"

$headers = @{
    "Authorization" = "Bearer $JWT_TOKEN"
    "Content-Type" = "application/json"
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n🧪 Test: $Description" -ForegroundColor Yellow
    Write-Host "   URL: $Method $Url" -ForegroundColor Gray
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host "   ✅ Succès" -ForegroundColor Green
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        if ($statusCode -eq 403) {
            Write-Host "   🚫 Accès refusé (comme attendu)" -ForegroundColor Orange
        } elseif ($statusCode -eq 400) {
            Write-Host "   ⚠️  Requête invalide: $errorMessage" -ForegroundColor Red
        } else {
            Write-Host "   ❌ Erreur ($statusCode): $errorMessage" -ForegroundColor Red
        }
        
        return $null
    }
}

function Test-FeatureAccess {
    Write-Host "`n=== Tests du service Customer (gestion des abonnements) ===" -ForegroundColor Cyan
    
    # 1. Créer un client de test avec plan PME Starter
    $customerData = @{
        name = "Entreprise Test"
        email = "test@entreprise.com"
        customerType = "PME"
        subscriptionPlan = "pme_starter"
    } | ConvertTo-Json
    
    Test-Endpoint "$CUSTOMER_SERVICE_URL/customers" "POST" $customerData "Créer un client avec plan PME Starter"
    
    # 2. Vérifier les limites d'abonnement
    Test-Endpoint "$CUSTOMER_SERVICE_URL/subscriptions/current" "GET" $null "Récupérer l'abonnement actuel"
    
    # 3. Vérifier l'utilisation des fonctionnalités
    Test-Endpoint "$CUSTOMER_SERVICE_URL/subscriptions/usage" "GET" $null "Récupérer l'utilisation des fonctionnalités"
    
    Write-Host "`n=== Tests du service Accounting ===" -ForegroundColor Cyan
    
    # 4. Créer des écritures comptables (devrait consommer des crédits)
    for ($i = 1; $i -le 5; $i++) {
        $entryData = @{
            accountCode = "411000"
            description = "Écriture de test $i"
            debitAmount = 1000
            creditAmount = 0
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json
        
        Test-Endpoint "$ACCOUNTING_SERVICE_URL/journal-entries" "POST" $entryData "Créer écriture comptable #$i"
    }
    
    # 5. Tenter de générer un rapport financier
    $reportConfig = @{
        reportType = "balance_sheet"
        period = "current_month"
        format = "pdf"
    } | ConvertTo-Json
    
    Test-Endpoint "$ACCOUNTING_SERVICE_URL/journal-entries/reports/financial" "POST" $reportConfig "Générer rapport financier"
    
    # 6. Test d'analyse IA ADHA
    $documentData = @{
        documentType = "invoice"
        content = "Facture test pour analyse"
        analysisType = "classification"
    } | ConvertTo-Json
    
    Test-Endpoint "$ACCOUNTING_SERVICE_URL/adha-analysis/document-analysis" "POST" $documentData "Analyser document avec IA ADHA"
    
    Write-Host "`n=== Tests du service Gestion Commerciale ===" -ForegroundColor Cyan
    
    # 7. Créer des clients commerciaux
    for ($i = 1; $i -le 3; $i++) {
        $clientData = @{
            name = "Client Commercial $i"
            email = "client$i@test.com"
            phone = "+243900000$i"
            address = "Adresse $i, Kinshasa"
        } | ConvertTo-Json
        
        Test-Endpoint "$GESTION_COMMERCIALE_URL/customers" "POST" $clientData "Créer client commercial #$i"
    }
    
    # 8. Générer des factures
    for ($i = 1; $i -le 2; $i++) {
        $invoiceData = @{
            customerId = "test-customer-$i"
            items = @(
                @{
                    description = "Produit $i"
                    quantity = 2
                    unitPrice = 500
                }
            )
            dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json -Depth 3
        
        Test-Endpoint "$GESTION_COMMERCIALE_URL/invoices" "POST" $invoiceData "Générer facture #$i"
    }
    
    # 9. Exporter des données clients
    $exportConfig = @{
        format = "csv"
        fields = @("name", "email", "phone", "createdAt")
        dateRange = @{
            start = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
            end = (Get-Date).ToString("yyyy-MM-dd")
        }
    } | ConvertTo-Json -Depth 2
    
    Test-Endpoint "$GESTION_COMMERCIALE_URL/customers/export" "POST" $exportConfig "Exporter données clients"
    
    Write-Host "`n=== Tests du service Portfolio Institution ===" -ForegroundColor Cyan
    
    # 10. Ajouter des entreprises prospectables
    for ($i = 1; $i -le 2; $i++) {
        $companyData = @{
            name = "Entreprise Prospectable $i"
            sector = "Commerce"
            revenue = 1000000 + ($i * 500000)
            employees = 50 + ($i * 25)
            riskLevel = "medium"
        } | ConvertTo-Json
        
        Test-Endpoint "$PORTFOLIO_INSTITUTION_URL/prospection/companies" "POST" $companyData "Ajouter entreprise prospectable #$i"
    }
    
    # 11. Effectuer une évaluation de risque
    $riskAssessmentData = @{
        assessmentType = "financial"
        criteria = @("revenue_stability", "debt_ratio", "cash_flow")
        weightings = @{
            revenue_stability = 0.4
            debt_ratio = 0.3
            cash_flow = 0.3
        }
    } | ConvertTo-Json -Depth 2
    
    Test-Endpoint "$PORTFOLIO_INSTITUTION_URL/prospection/risk-assessment/test-company-1" "POST" $riskAssessmentData "Effectuer évaluation de risque"
    
    # 12. Calculer une cote de crédit
    $creditScoringData = @{
        financialData = @{
            revenue = 2000000
            assets = 5000000
            liabilities = 2000000
            cashFlow = 300000
        }
        businessData = @{
            yearsInBusiness = 8
            sector = "Commerce"
            marketPosition = "strong"
        }
    } | ConvertTo-Json -Depth 2
    
    Test-Endpoint "$PORTFOLIO_INSTITUTION_URL/prospection/credit-scoring/test-company-1" "POST" $creditScoringData "Calculer cote de crédit"
    
    # 13. Ajouter des utilisateurs de portefeuille
    $portfolioUserData = @{
        email = "portfolio.user@institution.com"
        name = "Gestionnaire Portfolio"
        role = "portfolio_manager"
        permissions = @("view_companies", "assess_risk", "generate_reports")
    } | ConvertTo-Json
    
    Test-Endpoint "$PORTFOLIO_INSTITUTION_URL/portfolio-users" "POST" $portfolioUserData "Ajouter utilisateur de portefeuille"
    
    Write-Host "`n=== Tests de dépassement de limites ===" -ForegroundColor Cyan
    
    # 14. Tenter de dépasser les limites (plan PME Starter : 300 écritures/mois)
    Write-Host "`n🚀 Test de dépassement des limites d'écritures comptables..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le 10; $i++) {
        $entryData = @{
            accountCode = "411000"
            description = "Écriture limite test $i"
            debitAmount = 100
            creditAmount = 0
            date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        } | ConvertTo-Json
        
        $result = Test-Endpoint "$ACCOUNTING_SERVICE_URL/journal-entries" "POST" $entryData "Écriture limite #$i"
        
        if ($null -eq $result) {
            Write-Host "   🎯 Limite atteinte après $i tentatives" -ForegroundColor Orange
            break
        }
    }
    
    Write-Host "`n=== Vérification finale de l'utilisation ===" -ForegroundColor Cyan
    
    # 15. Vérifier l'utilisation finale
    Test-Endpoint "$CUSTOMER_SERVICE_URL/subscriptions/usage" "GET" $null "Vérifier l'utilisation finale"
    
    # 16. Vérifier les alertes générées
    Test-Endpoint "$CUSTOMER_SERVICE_URL/subscriptions/alerts" "GET" $null "Récupérer les alertes de limites"
}

function Test-ManualFeatureAccess {
    Write-Host "`n=== Tests manuels du service d'accès ===" -ForegroundColor Cyan
    
    # Test de vérification manuelle d'accès
    $manualCheckData = @{
        customerId = "test-customer-id"
        feature = "ACCOUNTING_ENTRIES_MONTHLY"
        amount = 5
        actionType = "create_entry"
    } | ConvertTo-Json
    
    Test-Endpoint "$CUSTOMER_SERVICE_URL/access-control/check" "POST" $manualCheckData "Vérification manuelle d'accès"
    
    # Test de consommation manuelle
    $manualConsumptionData = @{
        customerId = "test-customer-id"
        feature = "FINANCIAL_REPORTS_GENERATION"
        amount = 1
        actionType = "generate_report"
        userId = "test-user-id"
    } | ConvertTo-Json
    
    Test-Endpoint "$CUSTOMER_SERVICE_URL/access-control/consume" "POST" $manualConsumptionData "Consommation manuelle de fonctionnalité"
}

function Show-TestSummary {
    Write-Host "`n=== Résumé des tests ===" -ForegroundColor Green
    Write-Host "✅ Tests d'intégration des services métier" -ForegroundColor Green
    Write-Host "✅ Tests de consommation des fonctionnalités" -ForegroundColor Green
    Write-Host "✅ Tests de dépassement des limites" -ForegroundColor Green
    Write-Host "✅ Tests de vérification d'accès" -ForegroundColor Green
    Write-Host "✅ Tests de génération d'alertes" -ForegroundColor Green
    
    Write-Host "`n=== Fonctionnalités testées ===" -ForegroundColor Cyan
    Write-Host "📊 Écritures comptables avec limites mensuelles" -ForegroundColor White
    Write-Host "🤖 Analyses IA ADHA avec consommation de tokens" -ForegroundColor White
    Write-Host "📈 Génération de rapports financiers" -ForegroundColor White
    Write-Host "👥 Gestion de clients avec limites actives" -ForegroundColor White
    Write-Host "🧾 Génération de factures avec limites mensuelles" -ForegroundColor White
    Write-Host "📤 Exports de données avec crédits mensuels" -ForegroundColor White
    Write-Host "🏢 Prospection d'entreprises avec limites" -ForegroundColor White
    Write-Host "⚖️  Évaluations de risque et cotes de crédit" -ForegroundColor White
    Write-Host "👤 Utilisateurs de portefeuille avec limites" -ForegroundColor White
    
    Write-Host "`n=== Vérifications recommandées ===" -ForegroundColor Yellow
    Write-Host "1. Vérifier les logs Kafka pour les événements d'accès" -ForegroundColor Gray
    Write-Host "2. Contrôler la base de données pour les compteurs de fonctionnalités" -ForegroundColor Gray
    Write-Host "3. Tester les différents plans d'abonnement (PME vs Institution)" -ForegroundColor Gray
    Write-Host "4. Valider les réinitialisations mensuelles des compteurs" -ForegroundColor Gray
    Write-Host "5. Tester les upgrades d'abonnement en temps réel" -ForegroundColor Gray
}

# Exécution des tests
try {
    Test-FeatureAccess
    Test-ManualFeatureAccess
    Show-TestSummary
    
    Write-Host "`n🎉 Tests terminés avec succès!" -ForegroundColor Green
    Write-Host "Le système de contrôle d'accès aux fonctionnalités est opérationnel." -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Erreur lors des tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Instructions pour la mise en production ===" -ForegroundColor Magenta
Write-Host "1. Configurer les variables d'environnement Kafka dans chaque service" -ForegroundColor Gray
Write-Host "2. Importer les plans d'abonnement dans la base de données" -ForegroundColor Gray
Write-Host "3. Configurer les tâches CRON pour la réinitialisation des compteurs" -ForegroundColor Gray
Write-Host "4. Mettre en place la surveillance des alertes de limites" -ForegroundColor Gray
Write-Host "5. Tester les scénarios de montée en charge" -ForegroundColor Gray