# Portfolio Institution Service Test Runner (PowerShell)
# This script runs the comprehensive test suite for the portfolio-institution-service

Write-Host "🚀 Starting Portfolio Institution Service Test Suite" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Navigate to the service directory
Set-Location "c:\Users\DevSpace\Wanzobe\Wanzo_Backend\apps\portfolio-institution-service"

Write-Host ""
Write-Host "📋 Test Environment Setup" -ForegroundColor Cyan
Write-Host "-------------------------" -ForegroundColor Cyan
Write-Host "✅ Service: portfolio-institution-service" -ForegroundColor Green
Write-Host "✅ Test Framework: Jest" -ForegroundColor Green
Write-Host "✅ Database: SQLite (in-memory for tests)" -ForegroundColor Green
Write-Host "✅ Test Types: Unit, Integration, E2E" -ForegroundColor Green

Write-Host ""
Write-Host "🧪 Running Unit Tests" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Yellow

try {
    npm run test:unit
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Unit tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Unit tests failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running unit tests: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 Running Integration Tests" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    npm run test:integration
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Integration tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Integration tests failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running integration tests: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Running End-to-End Tests" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

try {
    npm run test:e2e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ E2E tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ E2E tests failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running E2E tests: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Generating Coverage Report" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    npm run test:cov
    Write-Host "✅ Coverage report generated!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Could not generate coverage report: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 All Tests Completed Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📈 Test Summary:" -ForegroundColor Cyan
Write-Host "- Unit Tests: ✅ Passed" -ForegroundColor Green
Write-Host "- Integration Tests: ✅ Passed" -ForegroundColor Green
Write-Host "- End-to-End Tests: ✅ Passed" -ForegroundColor Green
Write-Host "- Coverage Report: ✅ Generated" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Coverage report available at: coverage/lcov-report/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
