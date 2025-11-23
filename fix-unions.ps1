$files = @(
  "apps\analytics-service\src\modules\graph\entities\extended-graph.entity.ts",
  "apps\customer-service\src\modules\institutions\entities\institution-regulatory.entity.ts",
  "apps\admin-service\src\modules\customers\entities\customer-detailed-profile.entity.ts"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    $content = Get-Content $file -Raw
    # Remplacer les union types par string
    $content = $content -replace ":\s*'[^']+'\s*(\|\s*'[^']+')+", ": string"
    Set-Content $file $content -NoNewline
    Write-Host " Fixed: $file"
  }
}
