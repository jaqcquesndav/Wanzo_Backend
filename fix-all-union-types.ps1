# Script pour remplacer tous les union types avec string literals par simple string
# dans tous les fichiers .entity.ts

$filesToFix = @(
    "apps\admin-service\src\modules\users\entities\user.entity.ts",
    "apps\admin-service\src\modules\auth\entities\user.entity.ts",
    "apps\portfolio-institution-service\src\modules\portfolios\entities\portfolio.entity.ts",
    "apps\portfolio-institution-service\src\modules\company-profile\entities\company-profile.entity.ts",
    "apps\payment-service\src\modules\payments\entities\payment-transaction.entity.ts",
    "apps\customer-service\src\modules\system-users\entities\user-settings.entity.ts",
    "apps\customer-service\src\modules\customers\financial-institution\entities\institution-services.entity.ts",
    "apps\customer-service\src\modules\customers\financial-institution\entities\institution-leadership.entity.ts",
    "apps\customer-service\src\modules\customers\financial-institution\entities\institution-branch.entity.ts",
    "apps\customer-service\src\modules\subscriptions\entities\business-feature-tracking.entity.ts",
    "apps\customer-service\src\modules\customers\financial-institution\entities\institution-regulatory.entity.ts",
    "apps\customer-service\src\modules\customers\company\entities\company-core.entity.ts",
    "apps\customer-service\src\modules\customers\company\entities\company-stocks.entity.ts",
    "apps\customer-service\src\modules\customers\company\entities\company-assets.entity.ts",
    "apps\analytics-service\src\modules\graph\entities\extended-graph.entity.ts",
    "apps\accounting-service\src\modules\credit-score\entities\credit-monitoring.entity.ts"
)

# Pattern: "type: string | 'literal1' | 'literal2' | ..." -> "type: string"
$pattern = ":\s*string\s*\|\s*'[^']+'\s*(?:\|\s*'[^']+'\s*)*"
$replacement = ": string"

$fixedCount = 0
$errorCount = 0

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        try {
            $content = Get-Content $file -Raw
            $newContent = $content -replace $pattern, $replacement
            
            if ($content -ne $newContent) {
                Set-Content -Path $file -Value $newContent -NoNewline
                Write-Host "[OK] Fixed: $file" -ForegroundColor Green
                $fixedCount++
            } else {
                Write-Host "[SKIP] No changes needed: $file" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "[ERROR] Failed to fix: $file - $_" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "[WARN] File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Fixed: $fixedCount files" -ForegroundColor Green
Write-Host "  Errors: $errorCount files" -ForegroundColor Red
Write-Host "  Total: $($filesToFix.Count) files processed" -ForegroundColor Cyan
