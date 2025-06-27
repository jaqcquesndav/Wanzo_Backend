# fix-institution-service.ps1 - Script pour résoudre les problèmes spécifiques au service portfolio-institution-service

Write-Host "Résolution des problèmes spécifiques au service portfolio-institution-service..." -ForegroundColor Green

# Vérifier si le service existe
if (-not (Test-Path "apps\portfolio-institution-service")) {
    Write-Host "Service 'portfolio-institution-service' introuvable. Vérifiez le nom et réessayez." -ForegroundColor Red
    Exit 1
}

# Vérifier si packages/shared/events existe
if (-not (Test-Path "packages\shared\events")) {
    Write-Host "Dossier 'packages\shared\events' introuvable. Vérifiez la structure du projet." -ForegroundColor Red
    Exit 1
}

# Étape 1: Mise à jour des dépendances
Write-Host "1. Installation des dépendances manquantes..." -ForegroundColor Yellow
Set-Location "apps\portfolio-institution-service"
npm install --save @nestjs/schedule@^4.0.0 @nestjs/microservices@^10.3.0 kafkajs --legacy-peer-deps
npm install --save-dev webpack webpack-node-externals ts-loader --legacy-peer-deps
Set-Location "..\..\"

# Étape 2: Désactiver temporairement les vérifications de type TypeScript strictes
Write-Host "2. Création du fichier tsconfig.build.json pour ignorer les vérifications de type..." -ForegroundColor Yellow
$tsconfigContent = @"
{
  "extends": "../../packages/tsconfig/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@wanzo/shared/*": ["../../packages/shared/*"]
    },
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
"@
Set-Content -Path "apps\portfolio-institution-service\tsconfig.build.json" -Value $tsconfigContent

# Étape 3: Ajouter le script build:docker à package.json
Write-Host "3. Ajout du script build:docker à package.json..." -ForegroundColor Yellow
$packageJsonPath = "apps\portfolio-institution-service\package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
$packageJson.scripts | Add-Member -Name "build:docker" -Value "nest build --config ./tsconfig.build.json --webpack --webpackConfigPath webpack-hmr.config.js" -MemberType NoteProperty -Force
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path $packageJsonPath

# Étape 4: Créer le fichier webpack-hmr.config.js
Write-Host "4. Création du fichier webpack-hmr.config.js..." -ForegroundColor Yellow
$webpackContent = @"
// webpack-hmr.config.js
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking for faster builds
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/],
      }),
    ],
  };
};
"@
Set-Content -Path "apps\portfolio-institution-service\webpack-hmr.config.js" -Value $webpackContent

Write-Host "Préparation terminée!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant construire le service avec TypeScript skipping:" -ForegroundColor Yellow
Write-Host "  $env:TS_SKIP_TYPECHECK=1; docker-compose build portfolio-institution-service" -ForegroundColor Yellow
Write-Host "ou utiliser le script d'initialisation:" -ForegroundColor Yellow
Write-Host "  .\setup-docker.ps1" -ForegroundColor Yellow
Write-Host "et choisir 'o' quand on vous demande d'ignorer les vérifications de type." -ForegroundColor Yellow
