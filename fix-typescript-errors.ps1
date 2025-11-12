# Script PowerShell pour correction automatique des erreurs TypeScript
# Pattern de correction systématique pour les contrôleurs

$ErrorTypes = @{
    "UnknownError" = @{
        "Pattern" = "catch \(error\) \{[^}]*error\.message[^}]*\}"
        "Replacement" = "catch (error) { const errorMessage = error instanceof Error ? error.message : 'Erreur système'; "
    }
    "ThrowUnknownError" = @{
        "Pattern" = "throw new HttpException\(error\.message"
        "Replacement" = "throw new HttpException(errorMessage"
    }
}

$ControllersToFix = @(
    "C:\Users\JACQUES\Documents\DevSpace\Wanzo_Backend\apps\customer-service\src\modules\customers\company\controllers\company-stocks.controller.ts",
    "C:\Users\JACQUES\Documents\DevSpace\Wanzo_Backend\apps\customer-service\src\modules\customers\financial-institution\controllers\institution-core.controller.ts"
)

Write-Host "🔧 CORRECTION AUTOMATIQUE DES ERREURS TYPESCRIPT" -ForegroundColor Green
Write-Host "📁 Fichiers à corriger: $($ControllersToFix.Count)" -ForegroundColor Yellow

foreach ($file in $ControllersToFix) {
    if (Test-Path $file) {
        Write-Host "🔄 Correction: $(Split-Path $file -Leaf)" -ForegroundColor Cyan
        $content = Get-Content $file -Raw
        
        # Pattern 1: Correction catch blocks
        $content = $content -replace "catch \(error\) \{(\s+)throw new HttpException\(error\.message", "catch (error) {`$1const errorMessage = error instanceof Error ? error.message : 'Erreur système';`$1throw new HttpException(errorMessage"
        
        # Pattern 2: Correction autres références error.message
        $content = $content -replace "error\.message\.includes", "errorMessage.includes"
        
        Set-Content $file $content -Encoding UTF8
        Write-Host "✅ Corrigé: $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
}

Write-Host "🎉 CORRECTION TERMINÉE!" -ForegroundColor Green