# Script PowerShell pour standardiser les configurations TypeScript de tous les microservices
# Ce script applique une configuration cohérente qui résout les problèmes de types

$services = @(
    "admin-service",
    "analytics-service", 
    "api-gateway",
    "customer-service",
    "gestion_commerciale_service",
    "portfolio-institution-service"
)

$standardConfig = @'
{
  "extends": "../../packages/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@wanzobe/shared/*": ["../../packages/shared/*"],
      "@wanzobe/types": ["../../packages/types"]
    },
    "skipLibCheck": true,
    "types": ["jest", "node"],
    "typeRoots": [
      "../../node_modules/@types"
    ]
  },
  "include": ["src/**/*", "../../packages/types/**/*.d.ts"],
  "exclude": ["node_modules", "dist"]
}
'@

Write-Host "Standardisation des configurations TypeScript des microservices..." -ForegroundColor Green

foreach ($service in $services) {
    $tsconfigPath = ".\apps\$service\tsconfig.json"
    
    if (Test-Path $tsconfigPath) {
        Write-Host "Mise à jour de $service..." -ForegroundColor Yellow
        $standardConfig | Out-File -FilePath $tsconfigPath -Encoding UTF8
        Write-Host "✅ $service mis à jour" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $tsconfigPath non trouvé" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Standardisation terminée !" -ForegroundColor Green
Write-Host "Tous les microservices utilisent maintenant une configuration TypeScript cohérente." -ForegroundColor Cyan
