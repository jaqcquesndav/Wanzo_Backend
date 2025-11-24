# Script pour remplacer tous les union types avec string literals par simple string
# dans customer-detailed-profile.entity.ts

$filePath = "apps\admin-service\src\modules\customers\entities\customer-detailed-profile.entity.ts"

$content = Get-Content $filePath -Raw

# Pattern: "type: string | 'literal1' | 'literal2' | ..." -> "type: string"
$pattern = ":\s*string\s*\|\s*'[^']+'\s*(?:\|\s*'[^']+'\s*)*"
$replacement = ": string"

$newContent = $content -replace $pattern, $replacement

Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Replaced all union types with 'string' in $filePath"
